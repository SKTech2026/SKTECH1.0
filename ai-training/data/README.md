# SKTECH Face Dataset

Place local, consented evaluation images under `raw/<person_id>/`:

```text
raw/
  person_001/
    image_001.jpg
    image_002.jpg
  person_002/
    image_001.jpg
    image_002.jpg
```

Use consented images only, with multiple angles and lighting conditions. Do not use private images without permission. Keep the dataset local for privacy and use it only for capstone evaluation and training.

Raw and processed images are ignored by Git. Never commit real face photos, personal identifiers, or credentials. The scripts expect one clear face per image and need at least two valid images per identity for validation.

Run from the repository root:

```powershell
python ai-training/scripts/train_face_model.py --data ai-training/data/raw
python ai-training/scripts/evaluate_face_model.py --data ai-training/data/raw
```

If the folder is empty, both scripts create safe empty reports and explain how to add a local dataset.
