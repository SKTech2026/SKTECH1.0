# SKTech AI Service

FastAPI service for encrypted facial registration and attendance verification.

## Setup

1. Create a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

On Windows, `dlib` often has to use a prebuilt wheel. If `pip install -r requirements.txt`
tries to compile `dlib` and fails, run:

```powershell
pip install dlib-bin
pip install --no-deps face-recognition==1.3.0 face-recognition-models==0.3.0
pip install -r requirements.txt
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Run:

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

- `POST /register-face`
- `POST /verify-face`
- `GET /health`

## Security Notes

- Raw images are never stored.
- Embeddings are encrypted with Fernet before returning.
- Verification attempts are logged under `logs/verification.log`.
- Failed verification attempts are limited to 3 per minute per IP.
