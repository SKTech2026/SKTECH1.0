# Fresh Railway administrator bootstrap

Use this command only after confirming the `sktech-fresh` PostgreSQL database has no
administrator. It creates one approved administrator and refuses to overwrite an
existing administrator or another account with the same ID or email. It is an
offline script; the application does not expose an admin creation endpoint.

In a PowerShell session with access to the fresh Railway PostgreSQL public proxy,
run from the repository root. Enter the database URL and password at secure prompts.
Do not use the production Supabase URL. Copy the exact proxy hostname from the
fresh database connection details; do not include a scheme or port in the host prompt.
Enter the database name from the path of that same URL (normally `railway`).

```powershell
$env:SKTECH_ADMIN_BOOTSTRAP_CONFIRM = 'CREATE_FIRST_ADMIN_ON_SKTECH_FRESH'
$env:RAILWAY_FRESH_DATABASE_HOST = Read-Host 'Fresh Railway proxy hostname'
$env:RAILWAY_FRESH_DATABASE_NAME = Read-Host 'Fresh Railway database name'
$env:SKTECH_BOOTSTRAP_ADMIN_ID = Read-Host 'New admin employee ID'
$env:SKTECH_BOOTSTRAP_ADMIN_EMAIL = Read-Host 'New admin email'
$env:SKTECH_BOOTSTRAP_ADMIN_NAME = Read-Host 'New admin display name'
$dbSecure = Read-Host 'Fresh Railway DATABASE_URL' -AsSecureString
$passwordSecure = Read-Host 'New strong admin password' -AsSecureString
$dbPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbSecure)
$passwordPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
try {
  $env:RAILWAY_FRESH_DATABASE_URL = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($dbPtr)
  $env:DATABASE_URL = $env:RAILWAY_FRESH_DATABASE_URL
  $env:SKTECH_BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPtr)
  node scripts/bootstrap-fresh-admin.cjs
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($dbPtr)
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPtr)
  'SKTECH_ADMIN_BOOTSTRAP_CONFIRM','RAILWAY_FRESH_DATABASE_HOST','RAILWAY_FRESH_DATABASE_NAME','SKTECH_BOOTSTRAP_ADMIN_ID','SKTECH_BOOTSTRAP_ADMIN_EMAIL','SKTECH_BOOTSTRAP_ADMIN_NAME','RAILWAY_FRESH_DATABASE_URL','DATABASE_URL','SKTECH_BOOTSTRAP_ADMIN_PASSWORD' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}
```

The password must be 16 to 256 characters and include upper and lower case letters,
a digit, and a symbol. The script prints only success or a fixed error category;
it does not print connection strings, passwords, or database error text.
Do not run it if the fresh database already has an administrator.

## Retry after a failure

First rerun the read-only administrator count against the **same fresh database**.
If it is greater than zero, stop. If it remains zero, use the error code to correct
the input or connection before rerunning the full command above:

| Code | Action |
| --- | --- |
| `BOOTSTRAP_CONFIRMATION` | Enter the exact confirmation value. |
| `BOOTSTRAP_TARGET` | Use the fresh database's **public** Railway URL. Check that `DATABASE_URL` matches it, the proxy hostname matches exactly, and the database name matches the URL path. The private Railway URL is not reachable from a local shell. |
| `BOOTSTRAP_IDENTITY` / `BOOTSTRAP_PASSWORD` | Correct the new identity or password. Do not reuse an existing OFFICIAL identity. |
| `BOOTSTRAP_ADMIN_EXISTS` | Stop; an administrator already exists. |
| `BOOTSTRAP_IDENTITY_EXISTS` | Choose a different employee ID or email. The existing account, including an OFFICIAL account, is never changed. |
| `BOOTSTRAP_LOCK_BUSY` / `BOOTSTRAP_CONFLICT` | Recheck the admin count and identity, then retry only if still absent. |
| `BOOTSTRAP_CONNECTION` | Check public TCP proxy host and port and network availability. |
| `BOOTSTRAP_DATABASE_AUTH` / `BOOTSTRAP_DATABASE_NAME` | Check the fresh database credentials or database name in the public URL. |
| `BOOTSTRAP_TLS` | Check the public URL SSL settings and Railway certificate configuration. |
| `BOOTSTRAP_SCHEMA` | Confirm the 36 Prisma migrations were applied to this exact database. |
| `BOOTSTRAP_UNKNOWN` | Recheck target and schema. The code suppresses raw errors to avoid leaking connection details; do not assume any write occurred. |

The prior generic failure message cannot identify which of these occurred. The
updated script reports a category on the next attempt. It performs no updates to
existing users and never creates an administrator when one already exists.

For the fresh deployment, set `NEXTAUTH_URL` to the URL users actually visit and
provide a stable independent `NEXTAUTH_SECRET`. The production domain must be
mapped to the fresh service before using it as that service's `NEXTAUTH_URL`.
Do not change the production domain as part of bootstrap.
