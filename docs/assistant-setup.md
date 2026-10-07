# SKTECH Gemini Dashboard Assistant setup

This assistant is designed for dashboard-only guidance and stays within SKTECH system features, navigation, and support.

## Environment variables

Set these in Railway for the app environment:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional; defaults to `gemini-2.5-flash` if not set)

Keep the key server-side only. Do not expose it to the browser or use a `NEXT_PUBLIC_` prefix.

## Railway example

In Railway, add these variables under the app environment:

```bash
GEMINI_API_KEY=your_server_side_key_here
GEMINI_MODEL=gemini-2.5-flash
```

## Behavior notes

- The assistant is available only in dashboard layouts.
- It is role-aware and uses the current page path to tailor guidance.
- It does not answer unrelated general questions.
- It refuses API key, secret, private-data, or bypass requests.
- If the Gemini key is missing, it falls back to a local SKTECH support reply.

## Route

The assistant API is served at:

- `POST /api/assistant/sktech`

The request expects:

```json
{
  "message": "How do I export a report?",
  "currentPath": "/dashboard/admin/analytics"
}
```

The server returns a JSON object with a single `reply` field when available.

## Privacy

The server sends only:

- user role
- current path
- allowed feature list
- the user question
- curated help context

It does not send raw database rows, tokens, credentials, or private profile details.
