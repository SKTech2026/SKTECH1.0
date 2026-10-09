# KK Portal domain setup

The main SKTECH portal remains at `https://sktech-ormin.com`. The official KK Member Portal is `https://sktech-kk-portal.com`; `https://www.sktech-kk-portal.com` is an optional alias. Both use the same application, database, authentication, and APIs. The older `https://kk.sktech-ormin.com` remains available for compatibility.

## Railway and DNS

1. Add `sktech-kk-portal.com` as a custom domain on the same Railway service as the main portal. Add `www.sktech-kk-portal.com` if desired. Keep the existing main and old KK domains attached.
2. Copy the exact DNS targets Railway provides for each domain. For the apex/root domain, use your DNS provider's ALIAS, ANAME, or CNAME flattening feature if required. The `www` host usually uses a CNAME to its Railway target. Follow Railway's displayed record types and values rather than assuming one target applies to all hosts.
3. Wait for DNS verification and TLS certificates in Railway before sharing the new domain.

## Route behavior

- The main domain root `/` stays on the SKTECH landing page.
- The new KK domain, optional `www` alias, and old KK subdomain redirect only `/` to `/kk` on the same host.
- Non-root KK routes, `/api/*`, `/_next/*`, public verification routes, the manifest, service worker, and static assets keep their existing behavior.
- New SK Chairperson invitation URLs use `https://sktech-kk-portal.com/kk/join/{code}` regardless of the dashboard's host.
- Existing invitation URLs on `sktech-ormin.com` or `kk.sktech-ormin.com` redirect to the same path and query on the new KK domain. Invitation codes and validation remain unchanged.

## Verification

- Check `/` on all four domains, and `/kk`, `/kk/login`, and `/kk/join/{valid-code}` on the new domain.
- Check an old invitation URL with query parameters redirects to the new host with its code and query intact.
- Create an invitation as an SK Chairperson; confirm its displayed and copied URL starts with `https://sktech-kk-portal.com`.
- Check KK dashboard access and public verification routes on the new domain. Domain routing is not an access control boundary; server role guards remain in force.
