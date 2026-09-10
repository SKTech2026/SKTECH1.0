# Local Model Artifacts

The training script writes local artifacts here:

- `face_prototypes.json`: identity prototype vectors generated from the existing SKTECH `face_recognition` embedding pipeline.
- `face_threshold_config.json`: evaluation output for review, not an automatic production setting.

These artifacts are ignored by Git because they can contain biometric-derived data. Do not commit real face embeddings or copy production embeddings into this workspace. Review FAR/FRR and security requirements before considering any runtime configuration change.

This workflow builds enrollment prototypes and calibrates verification thresholds. It does not train dlib weights from scratch.
