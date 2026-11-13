Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:RAILWAY_ENVIRONMENT_NAME -ne 'sktech-fresh' -or
    [string]::IsNullOrWhiteSpace($env:RAILWAY_FRESH_DATABASE_URL)) {
  throw 'Configure the fresh Railway public database URL and environment before running this command.'
}

$env:SKTECH_BOOTSTRAP_ADMIN_USERNAME = Read-Host 'Admin username'
$securePassword = Read-Host 'Admin password' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $env:SKTECH_BOOTSTRAP_ADMIN_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $env:SKTECH_ADMIN_BOOTSTRAP_CONFIRM = 'CREATE_FIRST_ADMIN_ON_SKTECH_FRESH'
  node scripts/bootstrap-fresh-admin.cjs
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  'SKTECH_BOOTSTRAP_ADMIN_USERNAME','SKTECH_BOOTSTRAP_ADMIN_PASSWORD','SKTECH_ADMIN_BOOTSTRAP_CONFIRM' | ForEach-Object {
    Remove-Item "Env:$_" -ErrorAction SilentlyContinue
  }
}
