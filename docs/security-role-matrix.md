# SKTECH security role matrix

## Role separation goals

- KK members can only access their own dashboard and public KK verification routes.
- Officials can only access official dashboard areas and public-safe official pages.
- Staff can only access staff dashboard areas and public-safe staff pages.
- Admin can only access admin dashboard areas and their allowed public pages.
- Public visitors can only access public-safe routes.

## Route enforcement summary

| Area | Enforcement | Notes |
|---|---|---|
| /dashboard/admin | server-side guard + layout guard | Only ADMIN role passes. |
| /dashboard/staff | server-side guard + layout guard | Only STAFF role passes. |
| /dashboard/official | server-side guard + layout guard | OFFICIAL role only; pending accounts keep limited access. |
| /dashboard/kk-member | server-side guard + layout guard | only KK_MEMBER role passes. |
| /official/auth | public login entry for official accounts | separate from KK flows. |
| /kk/login | public login entry for KK members | separate from official and staff login. |
| /kk/youthpass/[id] | public-safe verification view | no private data exposure. |
| /kk/certificates/[id] | public-safe verification view | no private data exposure. |
| /id/[id] | public-safe official credential view | no private contact data exposure. |

## Required security checks

1. Every dashboard route is protected by a server-side layout or page guard.
2. Sidebar visibility is not treated as an access control layer.
3. Wrong-role access must redirect to /unauthorized or the correct dashboard home.
4. APIs must validate session, role, scope, and public-safe output requirements.
5. CSV exports must escape spreadsheet formulas and remain role-scoped.

## Security test matrix

- KK Member cannot access /dashboard/official
- KK Member cannot access /dashboard/admin
- KK Member cannot access /dashboard/staff
- KK Member cannot access /dashboard/official/kk-registry
- KK Member cannot access /dashboard/official/kk-analytics
- Official cannot access /dashboard/admin
- Staff cannot access /dashboard/admin
- Public visitor cannot access any dashboard
- Public YouthPass page hides private fields
- Public Certificate page hides private fields
- Public ID page hides private fields
- CSV exports require correct role
- Wrong barangay or municipality scope is blocked

## Notes

This matrix is a guardrail for production QA and is intentionally limited to the role separation and public-safe verification rules in SKTECH.
