# Face AI deployment checklist (Railway)

Deploy the Next.js app and `ai-service` as separate services. Set the AI service Root Directory to `ai-service` so Railway uses its `Dockerfile` and `requirements.txt`; its start command runs Uvicorn on Railway's `PORT`. Set the AI service healthcheck path to `/health`. Confirm the response reports `status: ok` and `databaseConnected: true` before directing the app to it. The Python service uses local `face-recognition` and does not require a paid face API.

## Required variables

Set secrets in Railway service variables. Do not commit `.env` files. Railway environment variables take precedence over local development files.

| Service | Variable | Purpose |
| --- | --- | --- |
| Next.js | `DATABASE_URL` | Production PostgreSQL connection for Prisma. |
| Next.js | `NEXTAUTH_URL` | Public HTTPS URL of the app. |
| Next.js | `NEXTAUTH_SECRET` | Stable, independent authentication secret. |
| Next.js | `AI_SERVICE_URL` | URL of the deployed FastAPI service, preferably its Railway private address when both services share a project. |
| Next.js | `FACE_SECRET` | Shared request secret, identical to the AI service's value. |
| Next.js | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Private admission proof and Official photo storage. Keep the service role key server side. |
| Next.js | Email provider variables | Configure one provider below for registration OTP and review email. |
| AI service | `DATABASE_URL` | Production PostgreSQL connection for registered face lookup. |
| AI service | `FACE_SECRET` | Required in production; must match the Next.js value. |
| AI service | `AI_EMBEDDING_FERNET_KEY` | Required in production. Preserve this key across deployments so existing encrypted templates remain readable. |

Email provider choices, in app priority order:

- Resend: `RESEND_API_KEY` and `EMAIL_FROM`.
- Brevo: `BREVO_API_KEY` and `BREVO_FROM_EMAIL` (`BREVO_FROM_NAME` optional).
- SMTP: `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, and `EMAIL_FROM`. The app also accepts the `SMTP_*` and `EMAIL_USER`/`EMAIL_PASS` aliases in `src/lib/email.ts`.

The app also accepts `FACE_AI_BASE_URL` as a fallback when `AI_SERVICE_URL` is absent. `FACE_AI_SERVICE_URL` was used by local test setup only; **the deployed app does not read it**. Configure `AI_SERVICE_URL` in production. AWS Rekognition variables in `.env.example` relate to legacy endpoints and are not required by the current Official face registration page.

## Release order and failure behavior

1. Verify both services have the required variables, and that `AI_SERVICE_URL` resolves from the Next.js service to the FastAPI service. Keep `FACE_SECRET` and the encryption key private and stable. The AI Docker build excludes `.env`, virtual environments, logs, and cached bytecode.
2. Configure the Next.js service's single controlled pre-deploy step as `npm run prisma:migrate:deploy`. This runs `prisma migrate deploy` with that service's deployment environment. Confirm migration `20261013010000_add_sk_federation_levels` is included. Do not run a database reset or apply SQL manually to production. The AI service does not run migrations.
3. Deploy the AI service and check `/health`. Then deploy the Next.js app. If either deployment fails, inspect service logs and variables without copying secret values into tickets or chat.
4. If the AI service is unreachable, face registration returns a safe temporary-unavailable message and does not mark the face registered. ID photo inspection records an unavailable advisory result; Staff review remains available and requires a human decision. A similarity result never auto-approves an admission or profile change.

Railway references: [service variables](https://docs.railway.com/variables/reference), [Dockerfile root and path](https://docs.railway.com/builds/dockerfiles), [healthchecks](https://docs.railway.com/deployments/healthchecks), and [pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command).

## After deployment: manual live checks

- Open Official face registration. Test camera permission, capture, retry, preview, and a valid live face registration with a test account.
- Test a poor or static recording and temporary AI service unavailability; confirm clear errors and no enrollment.
- Upload a test ID photo. Confirm one-face quality result and advisory similarity when a registered template exists.
- Open the scoped Staff review. Confirm federation category and position, face registration state, ID photo state, advisory result, and manual review note are visible only to authorized reviewers.
- Approve or reject a disposable admission manually and confirm the resulting Official status. Check Official login, Admin Account Management, Digital ID rendering, and public ID privacy.
