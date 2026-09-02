# SKTECH Production Deployment Guide

This project deploys as:
- Frontend/API: Railway or Vercel (Next.js App Router)
- AI Service: Railway, Render, or another Python web service host (FastAPI)
- Database: PostgreSQL (managed)

## 1) Environment Variables

Set these in the **Next.js app service** environment variables:

- `DATABASE_URL` (PostgreSQL connection string)
- `SUPABASE_URL` (Supabase project URL for server-side Storage uploads)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only key for private admission proof uploads)
- `NEXTAUTH_URL` (your public app URL, e.g. `https://sktech10-production.up.railway.app`)
- `NEXTAUTH_SECRET` (long random secret)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AI_SERVICE_URL` (public URL of the deployed FastAPI AI service, e.g. `https://sktech-ai-production.up.railway.app`)
- `FACE_SECRET` (shared secret, must match AI service)
- Optional: `NEXT_PUBLIC_BASE_URL` (public base URL; if omitted, app resolves from request host)

Set these in the **AI service** environment variables:

- `DATABASE_URL` (same DB or dedicated read DB, as needed)
- `AI_EMBEDDING_FERNET_KEY` (generated Fernet key)
- `FACE_SECRET` (must match Vercel `FACE_SECRET`)
- `AI_ALLOWED_ORIGINS` (comma-separated allowed origins, e.g. `https://sktech10-production.up.railway.app`)

## 2) Prisma Migration (Production-Safe)

Never use `prisma migrate dev` in production.

Use:

```bash
npx prisma migrate deploy
```

The project already includes:
- `postinstall: prisma generate`
- `prisma:migrate:deploy` script

So you can also run:

```bash
npm run prisma:migrate:deploy
```

## 3) Railway Deployment Steps

Railway needs two services. The Next.js website does not automatically run the Python AI
service just because the `ai-service` folder is in the same repository.

### Next.js Website Service

1. Create a Railway service from the GitHub repo.
2. Set root directory to `/`.
3. Build command: `npm run build`
4. Start command: `npm start`
5. Set the Next.js environment variables from section 1.

### FastAPI AI Service

1. Create a second Railway service from the same GitHub repo.
2. Set root directory to `/ai-service`.
3. Build command:

```bash
pip install -r requirements.txt
```

4. Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Set the AI service environment variables from section 1.
6. Open the AI service URL and confirm `/health` works.
7. Copy the AI service public URL into the Next.js service as `AI_SERVICE_URL`.
8. Redeploy the Next.js service after changing `AI_SERVICE_URL`.

## 4) Vercel Deployment Steps

1. Push latest code to GitHub.
2. Import repo into Vercel.
3. Set all required env vars above.
4. Build command: `npm run build`
5. Output: default Next.js output.
6. Deploy.

Notes:
- App uses PWA (`next-pwa`) only in production build.
- API routes are marked `dynamic = "force-dynamic"` to avoid stale auth/attendance responses.

## 5) Render Deployment Steps (AI Service)

1. Create a new Web Service from repo.
2. Set **Root Directory** to `ai-service`.
3. Build command:

```bash
pip install -r requirements.txt
```

4. Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Set env vars listed above.
6. Deploy and copy Render URL to Vercel `AI_SERVICE_URL`.

## 6) Local Verification Before Release

From project root:

```bash
npm run lint
npm run build
npm start
```

AI service local run:

```bash
cd ai-service
uvicorn main:app --reload --port 8000
```

Then set frontend env:

```env
AI_SERVICE_URL=http://localhost:8000
```

## 7) Security Checklist

- Do not commit `.env` files.
- Keep `NEXTAUTH_SECRET`, `FACE_SECRET`, and `AI_EMBEDDING_FERNET_KEY` private.
- Use HTTPS-only production URLs.
- Never store raw facial images; only encrypted embeddings are persisted.
