# SKTECH Production Deployment Guide

This project deploys as:
- Frontend/API: Vercel (Next.js App Router)
- AI Service: Render (FastAPI)
- Database: PostgreSQL (managed)

## 1) Environment Variables

Set these in **Vercel** (Project Settings > Environment Variables):

- `DATABASE_URL` (PostgreSQL connection string)
- `NEXTAUTH_URL` (your Vercel app URL, e.g. `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` (long random secret)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AI_SERVICE_URL` (Render URL of AI service, e.g. `https://sktech-ai.onrender.com`)
- `FACE_SECRET` (shared secret, must match AI service)
- Optional: `NEXT_PUBLIC_BASE_URL` (public base URL; if omitted, app resolves from request host)

Set these in **Render** (AI service Environment):

- `DATABASE_URL` (same DB or dedicated read DB, as needed)
- `AI_EMBEDDING_FERNET_KEY` (generated Fernet key)
- `FACE_SECRET` (must match Vercel `FACE_SECRET`)
- `AI_ALLOWED_ORIGINS` (comma-separated allowed origins, e.g. `https://your-app.vercel.app`)

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

## 3) Vercel Deployment Steps

1. Push latest code to GitHub.
2. Import repo into Vercel.
3. Set all required env vars above.
4. Build command: `npm run build`
5. Output: default Next.js output.
6. Deploy.

Notes:
- App uses PWA (`next-pwa`) only in production build.
- API routes are marked `dynamic = "force-dynamic"` to avoid stale auth/attendance responses.

## 4) Render Deployment Steps (AI Service)

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

## 5) Local Verification Before Release

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

## 6) Security Checklist

- Do not commit `.env` files.
- Keep `NEXTAUTH_SECRET`, `FACE_SECRET`, and `AI_EMBEDDING_FERNET_KEY` private.
- Use HTTPS-only production URLs.
- Never store raw facial images; only encrypted embeddings are persisted.
