# KK Portal domain setup

## Overview

The main application remains hosted on the primary domain and continues to serve official, admin, and staff workflows. The KK member portal can run on a dedicated subdomain such as `kk.sktech-ormin.com` while preserving the same route behavior under `/kk`.

## Railway custom domain setup

1. In Railway, open the project and go to the domain settings.
2. Add a custom domain:
   - `kk.sktech-ormin.com`
3. Railway will provide the target hostname for the DNS record.
4. Add the DNS record in your DNS provider:
   - Type: CNAME
   - Host: `kk`
   - Value: Railway target hostname
5. Wait for Railway to provision the certificate and validate the custom domain.
6. Verify the app is reachable at:
   - `https://kk.sktech-ormin.com`

## Expected behavior

- `https://sktech-ormin.com` remains the main landing and internal app domain.
- `https://kk.sktech-ormin.com` redirects the root path to `/kk`.
- Public verification pages continue to work on their normal routes and remain public-safe.
- KK member login remains on `/kk/login`.
- Admin, staff, and official users must continue using the main portal or their dedicated login routes.

## Security guidance

- Domain separation is only a branding and entry-point convenience.
- Role checks remain enforced in the server-side guards and layout code.
- Do not rely on host checks alone for access control.
- Keep all `/api/*`, `/_next/*`, and static asset routes unaffected by host-based routing.

## Verification checklist

- Root request on the KK subdomain opens the KK landing page.
- KK login works as `/kk/login`.
- Invite links and public verification routes still work.
- Admin/staff/official portals remain on the main domain and are not swapped to the KK subdomain route.
