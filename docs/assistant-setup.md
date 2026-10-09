# SKTECH assistant setup

SKTECH has two separate assistant routes:

- **Dashboard:** `POST /api/assistant/sktech` requires an authenticated session. It uses the signed-in role and dashboard path for SKTECH-only guidance.
- **Public landing:** `POST /api/assistant/public` needs no session. It receives only a public question, checks it against curated public topics, and sends that question plus the matching public knowledge to Gemini. It does not query member records or use dashboard context.

## Railway environment variables

Set these on the server-side app service in Railway:

```bash
GEMINI_API_KEY=your_server_side_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

`GEMINI_MODEL` is optional. The public route defaults to `gemini-2.5-flash-lite`; the dashboard route retains its existing `gemini-2.5-flash` default. A configured `GEMINI_MODEL` applies to both routes. Use a model available to the project's Gemini API key.

Keep `GEMINI_API_KEY` server-side. Never put it in browser code or a variable with a `NEXT_PUBLIC_` prefix. The public route sends the key to Gemini in a server-side request header.

## Public assistant behavior

The landing bot calls `/api/assistant/public` with a `message` and optional public page path. The route accepts questions up to 500 characters about public SKTECH features, KK joining, portal login, YouthPass and certificate verification, privacy, and navigation. It answers short greetings and clarifies vague Filipino or Taglish requests such as `pano`, while refusing unrelated or private-data requests. It does not read cookies, sessions, or database records.

If the key is missing, the public route returns a configuration notice and a curated local answer. If Gemini is unavailable, it returns the curated answer. The dashboard route keeps its existing authenticated fallback behavior.

The public route caps Gemini output at 400 tokens with temperature `0.2`. The browser receives only the answer or a validation error, never the system instruction or key.
It also applies a per-instance request limit before calling Gemini. For stronger limits across multiple app instances, use an infrastructure-level rate limiter.

## Dashboard assistant behavior

The dashboard route expects a message, current dashboard path, and optional recent context. It still requires a session and uses role-aware SKTECH guidance. Its existing fallback and guardrails are unchanged.
