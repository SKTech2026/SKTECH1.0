# Fresh Railway administrator bootstrap

Use this command only after confirming the `sktech-fresh` PostgreSQL database has no
administrator. It creates one approved administrator and refuses to overwrite an
existing administrator or another account with the same ID or email. It is an
offline script; the application does not expose an admin creation endpoint.

In a PowerShell session with access to the fresh Railway PostgreSQL public proxy,
run from the repository root. Enter the database URL and password at secure prompts.
Do not use the production Supabase URL. Copy the exact proxy hostname from the
fresh database connection details; do not include a scheme or port in the host prompt.

```powershell
$env:SKTECH_ADMIN_BOOTSTRAP_CONFIRM = 'CREATE_FIRST_ADMIN_ON_SKTECH_FRESH'
$env:RAILWAY_FRESH_DATABASE_HOST = Read-Host 'Fresh Railway proxy hostname'
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
  'SKTECH_ADMIN_BOOTSTRAP_CONFIRM','RAILWAY_FRESH_DATABASE_HOST','SKTECH_BOOTSTRAP_ADMIN_ID','SKTECH_BOOTSTRAP_ADMIN_EMAIL','SKTECH_BOOTSTRAP_ADMIN_NAME','RAILWAY_FRESH_DATABASE_URL','DATABASE_URL','SKTECH_BOOTSTRAP_ADMIN_PASSWORD' | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}
```

The password must be 16 to 256 characters and include upper and lower case letters,
a digit, and a symbol. The script prints only success or a generic failure message.
Do not run it if the fresh database already has an administrator.

For the fresh deployment, set `NEXTAUTH_URL` to the URL users actually visit and
provide a stable independent `NEXTAUTH_SECRET`. The production domain must be
mapped to the fresh service before using it as that service's `NEXTAUTH_URL`.
Do not change the production domain as part of bootstrap.
