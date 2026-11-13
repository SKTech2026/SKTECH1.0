# First administrator on fresh Railway

The offline bootstrap asks for only an **admin username** and **admin password**.
It stores the username as `User.employeeId` and display name. `User.email` is
nullable in the current Prisma schema and is left null. The password is hashed.
The command refuses an existing administrator or a username used by any account;
it does not update the existing OFFICIAL account.

## One-time connection prerequisite

Configure `RAILWAY_FRESH_DATABASE_URL` securely with the **public TCP proxy URL**
of the `Postgres` service in Railway environment `sktech-fresh`. Set
`RAILWAY_ENVIRONMENT_NAME=sktech-fresh` and set `RAILWAY_FRESH_DATABASE_HOST`
to the exact public proxy hostname from that service. If `DATABASE_URL` is also set in the
process, it must equal `RAILWAY_FRESH_DATABASE_URL`. Do not save the public URL
in this repository or paste it into chat. The offline script rejects Supabase,
other hosts, and private Railway URLs. The rotated PostgreSQL password must be
used in the URL. The URL is a connection prerequisite, not an administrator field.

No fresh Railway URL is available in this checkout. A local shell needs an
authorized connection supplied through its protected environment before the
command can connect.

## Create the first admin

From the repository root, after confirming the fresh database has zero ADMIN
rows, run:

```powershell
& .\scripts\bootstrap-fresh-admin.ps1
```

Enter only the requested username and password. The username must be 4–64
characters using letters, digits, dots, underscores, or hyphens. Use a new
password of 16–256 characters with upper and lower case letters, a digit, and
a symbol. Do not reuse a password previously posted in chat. The password
prompt masks input; neither the password nor connection URL is printed.

After success, confirm exactly one `APPROVED` ADMIN row on the same fresh
database, then sign in at `/login?role=ADMIN` using that username and password.
The production domain must serve the fresh app before testing there.

## Failure categories

The script prints a fixed `BOOTSTRAP_*` code without database error text.
`TARGET` means the environment marker or public URL failed validation;
`PASSWORD` or `IDENTITY` means the supplied admin input failed validation;
`ADMIN_EXISTS` or `IDENTITY_EXISTS` means no account was created;
`CONNECTION`, `DATABASE_AUTH`, `DATABASE_NAME`, and `TLS` concern connectivity;
`SCHEMA`, `DATABASE_PERMISSION`, `PRISMA_QUERY`, and `TRANSACTION` concern database
execution. `UNKNOWN` means the error could not be safely classified.
After any failure, recheck the ADMIN count before retrying.
