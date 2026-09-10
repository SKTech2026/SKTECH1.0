"""Evaluate prototype verification accuracy, thresholds, and inference speed."""

from __future__ import annotations

import argparse
import csv
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import face_recognition
import numpy as np

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
THRESHOLDS = [round(value, 2) for value in np.arange(0.35, 0.91, 0.05)]


def default_data_path() -> Path:
    return Path(__file__).resolve().parents[1] / "data" / "raw"


def workspace_root() -> Path:
    return Path(__file__).resolve().parents[1]


def image_files(data_path: Path) -> list[Path]:
    if not data_path.exists():
        return []
    return sorted(
        path
        for path in data_path.rglob("*")
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def extract_embedding(path: Path) -> tuple[np.ndarray | None, dict[str, float], str | None]:
    total_started = time.perf_counter()
    preprocessing_started = time.perf_counter()
    try:
        image = face_recognition.load_image_file(path)
    except Exception as error:  # noqa: BLE001
        return None, {"preprocessingMs": (time.perf_counter() - preprocessing_started) * 1000}, str(error)
    preprocessing_ms = (time.perf_counter() - preprocessing_started) * 1000

    detection_started = time.perf_counter()
    locations = face_recognition.face_locations(image, model="hog")
    detection_ms = (time.perf_counter() - detection_started) * 1000
    if len(locations) != 1:
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": detection_ms,
            "totalMs": (time.perf_counter() - total_started) * 1000,
        }, f"expected exactly one face, detected {len(locations)}"

    embedding_started = time.perf_counter()
    encodings = face_recognition.face_encodings(image, known_face_locations=locations, model="small")
    embedding_ms = (time.perf_counter() - embedding_started) * 1000
    if len(encodings) != 1:
        return None, {
            "preprocessingMs": preprocessing_ms,
            "faceDetectionMs": detection_ms,
            "embeddingGenerationMs": embedding_ms,
            "totalMs": (time.perf_counter() - total_started) * 1000,
        }, "face embedding could not be generated"

    return np.asarray(encodings[0], dtype=np.float32), {
        "preprocessingMs": preprocessing_ms,
        "faceDetectionMs": detection_ms,
        "embeddingGenerationMs": embedding_ms,
        "totalMs": (time.perf_counter() - total_started) * 1000,
    }, None


def metric_row(threshold: float, genuine: list[float], impostor: list[float]) -> dict[str, float | int]:
    true_accepts = sum(distance < threshold for distance in genuine)
    false_rejects = len(genuine) - true_accepts
    false_accepts = sum(distance < threshold for distance in impostor)
    true_rejects = len(impostor) - false_accepts
    total = true_accepts + false_rejects + false_accepts + true_rejects
    accuracy = (true_accepts + true_rejects) / total if total else 0.0
    far = false_accepts / len(impostor) if impostor else 0.0
    frr = false_rejects / len(genuine) if genuine else 0.0
    precision = true_accepts / (true_accepts + false_accepts) if true_accepts + false_accepts else 0.0
    recall = true_accepts / (true_accepts + false_rejects) if true_accepts + false_rejects else 0.0
    return {
        "threshold": threshold,
        "accuracy": accuracy,
        "far": far,
        "frr": frr,
        "precision": precision,
        "recall": recall,
        "trueAccepts": true_accepts,
        "falseAccepts": false_accepts,
        "trueRejects": true_rejects,
        "falseRejects": false_rejects,
        "genuineComparisons": len(genuine),
        "impostorComparisons": len(impostor),
    }


def empty_summary(data_path: Path) -> dict[str, Any]:
    print(f"No local face dataset found at {data_path}.")
    print("Add consented images to ai-training/data/raw/ to run training and evaluation.")
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "algorithm": "face_recognition_dlib_embeddings_with_identity_prototypes",
        "dataset": {"path": str(data_path), "identityCount": 0, "imageCount": 0},
        "metrics": {"validationSamples": 0, "genuineComparisons": 0, "impostorComparisons": 0},
        "recommendedThreshold": None,
        "thresholdSweep": [],
        "timingMs": {},
        "message": "No local face dataset found. Add consented images to ai-training/data/raw/ to run training and evaluation.",
    }


def evaluate(data_path: Path) -> dict[str, Any]:
    files = image_files(data_path)
    if not files:
        return empty_summary(data_path)

    samples: dict[str, list[tuple[np.ndarray, dict[str, float]]]] = {}
    failures: list[dict[str, str]] = []
    timing_values: dict[str, list[float]] = {
        "preprocessingMs": [],
        "faceDetectionMs": [],
        "embeddingGenerationMs": [],
        "comparisonMs": [],
        "totalMs": [],
    }
    for index, path in enumerate(files, start=1):
        embedding, timings, error = extract_embedding(path)
        if error:
            failures.append({"path": str(path), "reason": error})
            print(f"[{index}/{len(files)}] FAILED {path}: {error}")
            continue
        for key in ("preprocessingMs", "faceDetectionMs", "embeddingGenerationMs", "totalMs"):
            if key in timings:
                timing_values[key].append(timings[key])
        samples.setdefault(path.parent.name, []).append((embedding, timings))
        print(f"[{index}/{len(files)}] evaluated {path}")

    train_prototypes: dict[str, np.ndarray] = {}
    validation_samples: list[tuple[str, np.ndarray]] = []
    for identity, identity_samples in sorted(samples.items()):
        if len(identity_samples) < 2:
            print(f"Skipping validation for {identity}: at least two valid images are required.")
            continue
        split_index = max(1, int(len(identity_samples) * 0.6))
        if split_index >= len(identity_samples):
            split_index = len(identity_samples) - 1
        train_embeddings = [item[0] for item in identity_samples[:split_index]]
        train_prototypes[identity] = np.mean(np.stack(train_embeddings), axis=0).astype(np.float32)
        validation_samples.extend((identity, item[0]) for item in identity_samples[split_index:])

    genuine_distances: list[float] = []
    impostor_distances: list[float] = []
    comparison_times: list[float] = []
    for identity, embedding in validation_samples:
        comparison_started = time.perf_counter()
        distances = {name: float(np.linalg.norm(prototype - embedding)) for name, prototype in train_prototypes.items()}
        comparison_times.append((time.perf_counter() - comparison_started) * 1000)
        if identity not in distances:
            continue
        genuine_distances.append(distances[identity])
        impostor_distances.extend(distance for name, distance in distances.items() if name != identity)

    timing_values["comparisonMs"] = comparison_times
    sweep = [metric_row(threshold, genuine_distances, impostor_distances) for threshold in THRESHOLDS]
    usable_rows = [row for row in sweep if row["genuineComparisons"] or row["impostorComparisons"]]
    recommended = max(
        usable_rows,
        key=lambda row: (float(row["accuracy"]), -float(row["far"]), -float(row["frr"])),
        default=None,
    )
    averages = {
        key: round(float(np.mean(values)), 3) if values else None
        for key, values in timing_values.items()
    }
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "algorithm": "face_recognition_dlib_embeddings_with_identity_prototypes",
        "dataset": {
            "path": str(data_path),
            "identityCount": len(samples),
            "imageCount": len(files),
            "successfulImages": sum(len(value) for value in samples.values()),
            "failedImages": len(failures),
            "failures": failures,
        },
        "split": {
            "trainingIdentities": len(train_prototypes),
            "validationSamples": len(validation_samples),
            "rule": "60 percent enrollment prototype, 40 percent validation per identity",
        },
        "metrics": {
            "genuineComparisons": len(genuine_distances),
            "impostorComparisons": len(impostor_distances),
            "recommended": recommended,
        },
        "recommendedThreshold": recommended["threshold"] if recommended else None,
        "thresholdSweep": sweep,
        "timingMs": averages,
        "message": "Evaluation complete." if recommended else "Insufficient valid samples for threshold evaluation.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=default_data_path())
    parser.add_argument(
        "--output",
        type=Path,
        default=workspace_root() / "reports" / "face_evaluation_summary.json",
    )
    parser.add_argument(
        "--csv-output",
        type=Path,
        default=workspace_root() / "reports" / "threshold_sweep.csv",
    )
    parser.add_argument(
        "--threshold-config",
        type=Path,
        default=workspace_root() / "models" / "face_threshold_config.json",
    )
    args = parser.parse_args()

    summary = evaluate(args.data.resolve())
    for path in (args.output, args.csv_output, args.threshold_config):
        path.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    with args.csv_output.open("w", newline="", encoding="utf-8") as handle:
        rows = summary["thresholdSweep"]
        fieldnames = list(rows[0].keys()) if rows else ["threshold", "accuracy", "far", "frr", "precision", "recall"]
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    config = {
        "generatedAt": summary["generatedAt"],
        "algorithm": summary["algorithm"],
        "recommendedThreshold": summary["recommendedThreshold"],
        "sourceReport": str(args.output),
        "warning": "Review FAR/FRR and security requirements before changing production thresholds.",
    }
    args.threshold_config.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

    print(summary["message"])
    print(f"Recommended threshold: {summary['recommendedThreshold']}")
    print(f"Saved evaluation report to {args.output.resolve()}")
    print(f"Saved threshold sweep to {args.csv_output.resolve()}")


if __name__ == "__main__":
    main()
