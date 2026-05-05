from __future__ import annotations

import asyncio
import base64
import hmac
import io
import logging
import os
import time
from collections import defaultdict, deque
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import asyncpg
import numpy as np

try:
    import face_recognition
except ImportError:
    face_recognition = None
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


APP_TITLE = "SKTech AI Facial Recognition Service"
APP_VERSION = "1.1.0"
DEFAULT_THRESHOLD = 0.60
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_FAILED_ATTEMPTS_PER_WINDOW = 3

SERVICE_DIR = Path(__file__).resolve().parent
# Load project env first, then allow ai-service/.env to override service-specific values.
load_dotenv(SERVICE_DIR.parent / ".env")
load_dotenv(SERVICE_DIR / ".env", override=True)

FACE_DETECTION_MODEL = os.getenv("AI_FACE_MODEL", "hog")
FACE_SECRET = (os.getenv("FACE_SECRET") or "").strip()


class RegisterFaceRequest(BaseModel):
    userId: str = Field(min_length=1)
    imageBase64: str = Field(min_length=20)
    livenessFrames: List[str] = Field(default_factory=list, max_length=8)


class RegisterFaceResponse(BaseModel):
    userId: str
    encryptedEmbedding: str
    detectedFaces: int
    livenessPassed: bool
    message: str


class VerifyFacesRequest(BaseModel):
    image: Optional[str] = None
    imageBase64: Optional[str] = None
    livenessFrames: List[str] = Field(default_factory=list, max_length=8)
    threshold: float = Field(default=DEFAULT_THRESHOLD, ge=0.35, le=1.0)

    def resolve_image(self) -> str:
        candidate = self.imageBase64 or self.image
        if not candidate:
            raise HTTPException(status_code=400, detail="image or imageBase64 is required.")
        return candidate


class DetectedFace(BaseModel):
    userId: Optional[str]
    fullName: Optional[str]
    role: Optional[str]
    municipality: Optional[str]
    confidence: float
    distance: float
    box: List[int]
    isRegistered: bool
    isLive: bool
    label: str


class VerifyFacesResponse(BaseModel):
    faces: List[DetectedFace]
    totalFaces: int
    matchedCount: int
    threshold: float
    livenessPassed: bool
    livenessScore: float
    message: str


class FaceMatch(BaseModel):
    faceIndex: int
    matchedUserId: Optional[str]
    distance: float
    isMatch: bool


class VerifyFaceResponse(BaseModel):
    matchedUserId: Optional[str]
    totalFaces: int
    matchCount: int
    threshold: float
    livenessPassed: bool
    livenessScore: float
    queue: List[FaceMatch]
    message: str


def setup_logger() -> logging.Logger:
    logger = logging.getLogger("sktech-ai-service")
    if logger.handlers:
        return logger

    logger.setLevel(logging.INFO)
    log_dir = SERVICE_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "verification.log"

    handler = logging.FileHandler(log_path, encoding="utf-8")
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


LOGGER = setup_logger()

FERNET_KEY = os.getenv("AI_EMBEDDING_FERNET_KEY")
if not FERNET_KEY:
    FERNET_KEY = Fernet.generate_key().decode("utf-8")
    LOGGER.warning(
        "AI_EMBEDDING_FERNET_KEY is not set. Using ephemeral key. "
        "Set a stable key in production."
    )

FERNET = Fernet(FERNET_KEY.encode("utf-8"))
DATABASE_URL = os.getenv("DATABASE_URL")

MAX_WORKERS = int(os.getenv("AI_MAX_WORKERS", "4"))
EXECUTOR = ThreadPoolExecutor(max_workers=max(2, MAX_WORKERS))

failed_attempts: Dict[str, deque[float]] = defaultdict(deque)

app = FastAPI(title=APP_TITLE, version=APP_VERSION)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("AI_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
    app.state.db_pool = None
    if not DATABASE_URL:
        LOGGER.error("DATABASE_URL is not configured. Verification endpoints will fail.")
        return

    app.state.db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
    LOGGER.info("AI service started with async PostgreSQL pool.")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    pool = getattr(app.state, "db_pool", None)
    if pool:
        await pool.close()
    EXECUTOR.shutdown(wait=False, cancel_futures=True)


@app.get("/health")
async def health() -> Dict[str, str]:
    pool = getattr(app.state, "db_pool", None)
    return {
        "status": "ok",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "databaseConnected": "true" if pool is not None else "false",
    }


def _verify_service_secret(request: Request) -> None:
    if not FACE_SECRET:
        return

    incoming = (request.headers.get("x-face-secret") or "").strip()
    if not incoming or not hmac.compare_digest(incoming, FACE_SECRET):
        raise HTTPException(status_code=401, detail="Unauthorized AI service request.")


def _decode_base64_payload(payload: str) -> bytes:
    value = payload.strip()
    if value.startswith("data:image"):
        try:
            value = value.split(",", 1)[1]
        except IndexError as exc:
            raise ValueError("Invalid base64 image payload.") from exc

    try:
        return base64.b64decode(value, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Unable to decode base64 image.") from exc


def _load_image_from_base64(payload: str) -> np.ndarray:
    image_bytes = _decode_base64_payload(payload)
    return face_recognition.load_image_file(io.BytesIO(image_bytes))


def _extract_face_embeddings(
    image: np.ndarray,
) -> Tuple[List[np.ndarray], List[Tuple[int, int, int, int]]]:
    locations = face_recognition.face_locations(image, model=FACE_DETECTION_MODEL)
    if not locations:
        return [], []

    embeddings = face_recognition.face_encodings(image, locations, model="small")
    vectors = [np.asarray(embedding, dtype=np.float32) for embedding in embeddings]
    return vectors, locations


def _largest_face_index(locations: List[Tuple[int, int, int, int]]) -> int:
    largest_index = 0
    largest_area = -1
    for index, (top, right, bottom, left) in enumerate(locations):
        area = max(1, (bottom - top) * (right - left))
        if area > largest_area:
            largest_area = area
            largest_index = index
    return largest_index


def _encrypt_embedding(embedding: np.ndarray) -> str:
    binary = embedding.astype(np.float32).tobytes()
    encrypted = FERNET.encrypt(binary)
    return base64.urlsafe_b64encode(encrypted).decode("utf-8")


def _decrypt_embedding(encrypted_text: str) -> np.ndarray:
    token = base64.urlsafe_b64decode(encrypted_text.encode("utf-8"))
    decrypted = FERNET.decrypt(token)
    vector = np.frombuffer(decrypted, dtype=np.float32)
    if vector.size != 128:
        raise ValueError("Invalid embedding length.")
    return vector


def _eye_aspect_ratio(points: List[Tuple[int, int]]) -> float:
    p = np.asarray(points, dtype=np.float32)
    a = np.linalg.norm(p[1] - p[5])
    b = np.linalg.norm(p[2] - p[4])
    c = np.linalg.norm(p[0] - p[3]) + 1e-6
    return float((a + b) / (2.0 * c))


def _frame_liveness_metrics(image: np.ndarray) -> Optional[Tuple[float, np.ndarray]]:
    locations = face_recognition.face_locations(image, model=FACE_DETECTION_MODEL)
    if not locations:
        return None

    target = locations[_largest_face_index(locations)]
    landmarks_list = face_recognition.face_landmarks(image, [target])
    if not landmarks_list:
        return None

    landmarks = landmarks_list[0]
    if (
        "left_eye" not in landmarks
        or "right_eye" not in landmarks
        or "nose_tip" not in landmarks
    ):
        return None

    left_ear = _eye_aspect_ratio(landmarks["left_eye"])
    right_ear = _eye_aspect_ratio(landmarks["right_eye"])
    nose_tip = np.asarray(landmarks["nose_tip"], dtype=np.float32).mean(axis=0)
    return (left_ear + right_ear) / 2.0, nose_tip


def _evaluate_liveness(frame_payloads: List[str]) -> Tuple[bool, float, str]:
    if len(frame_payloads) < 2:
        return (
            False,
            0.0,
            "Liveness requires multiple frames. Static single-frame images are rejected.",
        )

    metrics: List[Tuple[float, np.ndarray]] = []
    for payload in frame_payloads:
        image = _load_image_from_base64(payload)
        metric = _frame_liveness_metrics(image)
        if metric is not None:
            metrics.append(metric)

    if len(metrics) < 2:
        return False, 0.0, "Unable to detect stable face landmarks for liveness."

    ears = np.asarray([item[0] for item in metrics], dtype=np.float32)
    nose_positions = np.asarray([item[1] for item in metrics], dtype=np.float32)

    blink_delta = float(ears.max() - ears.min())
    blink_score = float(np.clip((blink_delta - 0.012) / 0.06, 0.0, 1.0))
    blink_depth_score = 1.0 if float(ears.min()) < 0.24 else 0.0
    blink_combined = min(1.0, (blink_score * 0.75) + (blink_depth_score * 0.25))

    displacement = float(np.linalg.norm(nose_positions[-1] - nose_positions[0]))
    max_step = (
        float(np.max(np.linalg.norm(np.diff(nose_positions, axis=0), axis=1)))
        if len(nose_positions) > 1
        else 0.0
    )
    movement_score = float(np.clip((displacement + (max_step * 0.6)) / 7.5, 0.0, 1.0))

    liveness_score = float(np.clip(max(blink_combined, movement_score), 0.0, 1.0))
    passed = liveness_score >= 0.32
    if passed:
        return True, round(liveness_score, 4), "Liveness check passed."
    return False, round(liveness_score, 4), "No blink or sufficient head movement detected."


def _prune_attempts(ip: str) -> None:
    now = time.time()
    attempts = failed_attempts[ip]
    while attempts and now - attempts[0] > RATE_LIMIT_WINDOW_SECONDS:
        attempts.popleft()


def _check_rate_limit(ip: str) -> None:
    _prune_attempts(ip)
    if len(failed_attempts[ip]) >= MAX_FAILED_ATTEMPTS_PER_WINDOW:
        raise HTTPException(
            status_code=429,
            detail="Too many failed verification attempts. Try again in a minute.",
        )


def _record_failed_attempt(ip: str) -> None:
    _prune_attempts(ip)
    failed_attempts[ip].append(time.time())


def _clear_failed_attempts(ip: str) -> None:
    failed_attempts.pop(ip, None)


async def _fetch_registered_embeddings() -> Tuple[List[str], np.ndarray, Dict[str, Dict[str, Optional[str]]]]:
    pool = getattr(app.state, "db_pool", None)
    if pool is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection is not configured for facial verification.",
        )

    async with pool.acquire() as connection:
        rows = await connection.fetch(
            """
            SELECT
              u.id,
              u.name,
              u."faceEmbedding",
              o."firstName",
              o."lastName",
              o.role::text AS role,
              m.name AS municipality
            FROM "User" u
            LEFT JOIN "SKOfficial" o ON o."userId" = u.id
            LEFT JOIN "Municipality" m ON m.id = u."municipalityOfficerId"
            WHERE u."faceRegistered" = TRUE AND u."faceEmbedding" IS NOT NULL
            """
        )

    user_ids: List[str] = []
    vectors: List[np.ndarray] = []
    metadata: Dict[str, Dict[str, Optional[str]]] = {}

    for row in rows:
        encrypted_value = row["faceEmbedding"]
        if not encrypted_value:
            continue
        try:
            vectors.append(_decrypt_embedding(encrypted_value))
            user_id = row["id"]
            user_ids.append(user_id)

            first_name = row["firstName"]
            last_name = row["lastName"]
            if first_name and last_name:
                full_name = f"{first_name} {last_name}"
            else:
                full_name = row["name"] or "Unidentified Official"

            metadata[user_id] = {
                "fullName": full_name,
                "role": row["role"] or "OFFICIAL",
                "municipality": row["municipality"] or "Unassigned",
            }
        except (InvalidToken, ValueError) as error:
            LOGGER.warning("Skipping invalid encrypted embedding for user %s: %s", row["id"], error)

    if not vectors:
        raise HTTPException(
            status_code=404,
            detail="No registered facial embeddings found in the database.",
        )

    return user_ids, np.stack(vectors).astype(np.float32), metadata


def _distance_to_confidence(distance: float, threshold: float) -> float:
    if distance <= threshold:
        confidence = 0.55 + ((threshold - distance) / max(threshold, 1e-6)) * 0.45
    else:
        confidence = 0.55 - ((distance - threshold) / max(1.2 - threshold, 1e-6)) * 0.55
    return round(float(np.clip(confidence, 0.0, 1.0)), 4)


def _log_verification(ip: str, total_faces: int, match_count: int, status: str, reason: str) -> None:
    LOGGER.info(
        "verify_attempt ip=%s faces=%s matches=%s status=%s reason=%s",
        ip,
        total_faces,
        match_count,
        status,
        reason,
    )


def _build_unregistered_faces(
    locations: List[Tuple[int, int, int, int]],
    is_live: bool,
    liveness_message: str,
) -> List[DetectedFace]:
    faces: List[DetectedFace] = []
    for top, right, bottom, left in locations:
        faces.append(
            DetectedFace(
                userId=None,
                fullName=None,
                role=None,
                municipality=None,
                confidence=0.0,
                distance=1.0,
                box=[int(top), int(right), int(bottom), int(left)],
                isRegistered=False,
                isLive=is_live,
                label="Unregistered" if is_live else liveness_message,
            )
        )
    return faces


async def _verify_faces_core(
    payload: VerifyFacesRequest, ip_address: str
) -> VerifyFacesResponse:
    _check_rate_limit(ip_address)

    image_payload = payload.resolve_image()
    liveness_payloads = payload.livenessFrames if payload.livenessFrames else [image_payload]

    liveness_ok, liveness_score, liveness_message = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _evaluate_liveness, liveness_payloads
    )

    image = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _load_image_from_base64, image_payload
    )
    frame_embeddings, locations = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _extract_face_embeddings, image
    )

    if not frame_embeddings:
        # Kiosk scanning frequently captures empty frames between faces.
        # Treat this as neutral (not a failed security attempt).
        _log_verification(ip_address, 0, 0, "rejected", "No face detected.")
        raise HTTPException(status_code=400, detail="No face detected in verification frame.")

    if not liveness_ok:
        # Liveness failures are security-relevant; keep rate-limit accounting here.
        _record_failed_attempt(ip_address)
        _log_verification(ip_address, len(frame_embeddings), 0, "rejected", liveness_message)
        faces = _build_unregistered_faces(locations, False, liveness_message)
        return VerifyFacesResponse(
            faces=faces,
            totalFaces=len(faces),
            matchedCount=0,
            threshold=payload.threshold,
            livenessPassed=False,
            livenessScore=liveness_score,
            message=liveness_message,
        )

    try:
        registered_user_ids, registered_matrix, metadata = await _fetch_registered_embeddings()
    except HTTPException as error:
        if error.status_code == 404:
            # No enrolled profiles is a setup state, not an attack signal.
            _log_verification(
                ip_address,
                len(frame_embeddings),
                0,
                "unmatched",
                "no_registered_embeddings",
            )
            faces = _build_unregistered_faces(locations, True, "Unregistered")
            return VerifyFacesResponse(
                faces=faces,
                totalFaces=len(faces),
                matchedCount=0,
                threshold=payload.threshold,
                livenessPassed=True,
                livenessScore=liveness_score,
                message="No enrolled facial profiles yet. Register official faces first.",
            )
        raise

    detections: List[DetectedFace] = []
    for embedding, (top, right, bottom, left) in zip(frame_embeddings, locations):
        distances = np.linalg.norm(registered_matrix - embedding, axis=1)
        best_index = int(np.argmin(distances))
        best_distance = float(distances[best_index])
        confidence = _distance_to_confidence(best_distance, payload.threshold)
        matched_user_id = (
            registered_user_ids[best_index] if best_distance < payload.threshold else None
        )

        if matched_user_id:
            user_meta = metadata.get(matched_user_id, {})
            detections.append(
                DetectedFace(
                    userId=matched_user_id,
                    fullName=user_meta.get("fullName"),
                    role=user_meta.get("role"),
                    municipality=user_meta.get("municipality"),
                    confidence=confidence,
                    distance=round(best_distance, 6),
                    box=[int(top), int(right), int(bottom), int(left)],
                    isRegistered=True,
                    isLive=True,
                    label=user_meta.get("fullName") or "Registered",
                )
            )
        else:
            detections.append(
                DetectedFace(
                    userId=None,
                    fullName=None,
                    role=None,
                    municipality=None,
                    confidence=confidence,
                    distance=round(best_distance, 6),
                    box=[int(top), int(right), int(bottom), int(left)],
                    isRegistered=False,
                    isLive=True,
                    label="Unregistered",
                )
            )

    matched_count = sum(1 for item in detections if item.isRegistered)
    if matched_count > 0:
        _clear_failed_attempts(ip_address)
        _log_verification(
            ip_address,
            len(detections),
            matched_count,
            "matched",
            "verification_passed",
        )
    else:
        # Unmatched faces are expected in a live kiosk environment.
        # Avoid counting these toward failed-attempt lockout.
        _log_verification(
            ip_address,
            len(detections),
            0,
            "unmatched",
            "distance_threshold_not_met",
        )

    return VerifyFacesResponse(
        faces=detections,
        totalFaces=len(detections),
        matchedCount=matched_count,
        threshold=payload.threshold,
        livenessPassed=True,
        livenessScore=liveness_score,
        message="Face verification processed.",
    )


@app.post("/register-face", response_model=RegisterFaceResponse)
async def register_face(payload: RegisterFaceRequest, request: Request) -> RegisterFaceResponse:
    _verify_service_secret(request)

    liveness_payloads = payload.livenessFrames if payload.livenessFrames else [payload.imageBase64]
    liveness_ok, _, liveness_message = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _evaluate_liveness, liveness_payloads
    )
    if not liveness_ok:
        raise HTTPException(status_code=400, detail=liveness_message)

    image = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _load_image_from_base64, payload.imageBase64
    )
    embeddings, locations = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _extract_face_embeddings, image
    )

    if not embeddings:
        raise HTTPException(status_code=400, detail="No face detected in the registration image.")

    selected_index = _largest_face_index(locations)
    encrypted_embedding = await asyncio.get_running_loop().run_in_executor(
        EXECUTOR, _encrypt_embedding, embeddings[selected_index]
    )

    return RegisterFaceResponse(
        userId=payload.userId,
        encryptedEmbedding=encrypted_embedding,
        detectedFaces=len(embeddings),
        livenessPassed=True,
        message="Face embedding generated and encrypted successfully.",
    )


@app.post("/verify-faces", response_model=VerifyFacesResponse)
async def verify_faces(payload: VerifyFacesRequest, request: Request) -> VerifyFacesResponse:
    _verify_service_secret(request)
    ip_address = request.client.host if request.client else "unknown"
    return await _verify_faces_core(payload, ip_address)


@app.post("/verify-face", response_model=VerifyFaceResponse)
async def verify_face(payload: VerifyFacesRequest, request: Request) -> VerifyFaceResponse:
    _verify_service_secret(request)
    ip_address = request.client.host if request.client else "unknown"
    result = await _verify_faces_core(payload, ip_address)

    queue: List[FaceMatch] = []
    best_match: Optional[Tuple[str, float]] = None
    for index, face in enumerate(result.faces):
        matched_user_id = face.userId if face.isRegistered and face.isLive else None
        is_match = matched_user_id is not None
        queue.append(
            FaceMatch(
                faceIndex=index,
                matchedUserId=matched_user_id,
                distance=face.distance,
                isMatch=is_match,
            )
        )
        if matched_user_id and (best_match is None or face.distance < best_match[1]):
            best_match = (matched_user_id, face.distance)

    return VerifyFaceResponse(
        matchedUserId=best_match[0] if best_match else None,
        totalFaces=result.totalFaces,
        matchCount=result.matchedCount,
        threshold=result.threshold,
        livenessPassed=result.livenessPassed,
        livenessScore=result.livenessScore,
        queue=queue,
        message=result.message,
    )
