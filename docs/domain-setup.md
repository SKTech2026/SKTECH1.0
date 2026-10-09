# KK Portal domain setup

The main SKTECH portal remains at `https://sktech-ormin.com`. The active KK Member Portal domain is `https://kk-portal.sktech-ormin.com`. Both use the same application, database, authentication, and APIs. The older `https://kk.sktech-ormin.com` remains available as an alias. `sktech-kk-portal.com` is only an optional future custom domain if purchased and configured.

## Railway and DNS

1. Add `kk-portal.sktech-ormin.com` as a custom domain on the same Railway service as the main portal. Keep the existing main and old KK domains attached.
2. Copy the exact DNS target Railway provides. Add a CNAME for `kk-portal` at the `sktech-ormin.com` DNS provider, using Railway's displayed target. If the optional custom domain is purchased later, follow Railway's exact DNS instructions for that domain too.
3. Wait for DNS verification and TLS certificates in Railway before sharing the new domain.

## Route behavior

- The main domain root `/` stays on the SKTECH landing page.
- The active KK subdomain and old KK alias redirect only `/` to `/kk` on the same host. The optional custom domain does the same if configured later.
- Non-root KK routes, `/api/*`, `/_next/*`, public verification routes, the manifest, service worker, and static assets keep their existing behavior.
- New SK Chairperson invitation URLs use `https://kk-portal.sktech-ormin.com/kk/join/{code}` regardless of the dashboard's host.
- Existing invitation URLs on `sktech-ormin.com` or `kk.sktech-ormin.com` redirect to the same path and query on the active KK domain. Invitation codes and validation remain unchanged.

## Verification

- Check `/` on the main domain, active KK subdomain, and old KK alias; check `/kk`, `/kk/login`, and `/kk/join/{valid-code}` on the active KK domain.
- Check an old invitation URL with query parameters redirects to the new host with its code and query intact.
- Create an invitation as an SK Chairperson; confirm its displayed and copied URL starts with `https://kk-portal.sktech-ormin.com`.
- Check KK dashboard access and public verification routes on the new domain. Domain routing is not an access control boundary; server role guards remain in force.
