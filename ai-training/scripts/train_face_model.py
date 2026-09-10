"""Build local identity prototypes from the SKTECH embedding pipeline."""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import face_recognition
import numpy as np

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
EMBEDDING_ALGORITHM = "face_recognition_dlib_embeddings_with_identity_prototypes"


def default_data_path() -> Path:
    return Path(__file__).resolve().parents[1] / "data" / "raw"


def default_model_path() -> Path:
    return Path(__file__).resolve().parents[1] / "models" / "face_prototypes.json"


def image_files(data_path: Path) -> list[Path]:
    if not data_path.exists():
        return []
    return sorted(
        path
        for path in data_path.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def load_embedding(image_path: Path) -> tuple[np.ndarray | None, dict[str, float], str | None]:
    started = time.perf_counter()
    try:
        image = face_recognition.load_image_file(image_path)
    except Exception as error:  # noqa: BLE001
        return None, {"preprocessingMs": (time.perf_counter() - started) * 1000}, str(error)

    preprocessing_ms = (time.perf_counter() - started) * 1000
    detection_started = time.perf_counter()
    try:
        locations = face_recognition.face_locations(image, model="hog")
    except Exception as error:  # noqa: BLE001
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": (time.perf_counter() - detection_started) * 1000,
        }, str(error)

    detection_ms = (time.perf_counter() - detection_started) * 1000
    if len(locations) != 1:
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": detection_ms,
        }, f"expected exactly one face, detected {len(locations)}"

    embedding_started = time.perf_counter()
    try:
        encodings = face_recognition.face_encodings(image, known_face_locations=locations, model="small")
    except Exception as error:  # noqa: BLE001
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": detection_ms,
            "embeddingGenerationMs": (time.perf_counter() - embedding_started) * 1000,
        }, str(error)

    embedding_ms = (time.perf_counter() - embedding_started) * 1000
    if len(encodings) != 1:
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": detection_ms,
            "embeddingGenerationMs": embedding_ms,
        }, "face embedding could not be generated"

    return np.asarray(encodings[0], dtype=np.float32), {
        "preprocessingMs": preprocessing_ms,
        "faceDetectionMs": detection_ms,
        "embeddingGenerationMs": embedding_ms,
    }, None


def build_model(data_path: Path) -> dict[str, Any]:
    files = image_files(data_path)
    if not files:
        print(f"No local face dataset found at {data_path}.")
        print("Add consented images to ai-training/data/raw/ to run training and evaluation.")
        return {
            "modelVersion": "1.0.0",
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "algorithm": EMBEDDING_ALGORITHM,
            "embeddingDimension": 128,
            "identities": [],
            "metadata": {
                "identityCount": 0,
                "imageCount": 0,
                "successCount": 0,
                "failedDetectionCount": 0,
            },
        }

    embeddings_by_identity: dict[str, list[np.ndarray]] = {}
    failures: list[dict[str, str]] = []
    timing_totals = {"preprocessingMs": 0.0, "faceDetectionMs": 0.0, "embeddingGenerationMs": 0.0}

    for index, image_path in enumerate(files, start=1):
        identity = image_path.parent.name
        embedding, timings, error = load_embedding(image_path)
        for key in timing_totals:
            timing_totals[key] += timings.get(key, 0.0)
        if error:
            failures.append({"path": str(image_path), "reason": error})
            print(f"[{index}/{len(files)}] FAILED {image_path}: {error}")
            continue
        embeddings_by_identity.setdefault(identity, []).append(embedding)
        print(f"[{index}/{len(files)}] embedded {image_path}")

    identities = [
        {
            "id": identity,
            "sampleCount": len(embeddings),
            "prototype": np.mean(np.stack(embeddings), axis=0).astype(float).tolist(),
        }
        for identity, embeddings in sorted(embeddings_by_identity.items())
    ]
    success_count = sum(item["sampleCount"] for item in identities)
    return {
        "modelVersion": "1.0.0",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "algorithm": EMBEDDING_ALGORITHM,
        "embeddingDimension": 128,
        "identities": identities,
        "metadata": {
            "identityCount": len(identities),
            "imageCount": len(files),
            "successCount": success_count,
            "failedDetectionCount": len(failures),
            "failures": failures,
            "timingMs": {
                key: round(value, 3) for key, value in timing_totals.items()
            },
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=default_data_path())
    parser.add_argument("--output", type=Path, default=default_model_path())
    args = parser.parse_args()

    model = build_model(args.data.resolve())
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    metadata = model["metadata"]
    print(
        "Training/enrollment complete: "
        f"{metadata['successCount']} successful images, "
        f"{metadata['identityCount']} identity prototypes, "
        f"{metadata['failedDetectionCount']} failures."
    )
    print(f"Saved prototype artifact to {args.output.resolve()}")


if __name__ == "__main__":
    main()
