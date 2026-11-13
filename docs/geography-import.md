# Oriental Mindoro geography import

The canonical dropdown dataset is the user-provided
`src/data/oriental-mindoro-dropdowns.json`: 14 municipalities, City of Calapan,
and 426 barangays. The names have not been independently verified against PSA.
The old `prisma/seed.js`
contains only 14 LGUs and 264 barangays and must not be used for geography.
Forms use the canonical names and counts even when some barangay rows are still
missing. A missing or ambiguous database match appears as a disabled
`(pending import)` option; it cannot be submitted until it has a real database
ID. Existing selections keep their database IDs, and saved non-canonical values
remain available as disabled legacy options. The distinct Bansud choices
`Pag-Asa` and `Villa Pag-Asa` must remain separate.

Only the fresh Railway PostgreSQL public proxy is accepted. Provide these
variables in a protected process environment, without committing or printing
the URL:

- `RAILWAY_ENVIRONMENT_NAME=sktech-fresh`
- `RAILWAY_FRESH_DATABASE_HOST`: exact public proxy hostname for the fresh `Postgres` service
- `RAILWAY_FRESH_DATABASE_URL`: current public PostgreSQL connection URL for that service

Rollout sequence:

1. Deploy the application code to the fresh Railway environment and verify the
  running service is the intended `sktech-fresh` deployment. No database
  migration is required for these dropdown changes.
2. In a protected local PowerShell session, set
  `$env:RAILWAY_ENVIRONMENT_NAME`, `$env:RAILWAY_FRESH_DATABASE_HOST`, and
  `$env:RAILWAY_FRESH_DATABASE_URL` to the verified fresh PostgreSQL service
  values. Do not put the URL in source control or command logs.
3. Run `npm run seed`. This is a read-only preview. Review the per-LGU counts,
  `aliasMatches`, `missingCanonicalNames`, `legacyOnlyRecords`, conflicts,
  and all proposed additions before proceeding. The canonical accounting must
  satisfy `canonicalExactMatches + canonicalAliasMatches +
  canonicalBarangaysMissing + canonicalBarangaysBlocked = 426`.
4. Only after the preview has been reviewed and approved, run
  `npm run seed:geography:apply`. This adds missing municipalities and
  barangays in one transaction. The importer never creates, updates, or
  deletes users, never deletes geography records, reuses `Calapan City` when
  present, and does not change existing IDs or foreign keys.
5. Run `npm run seed` again and confirm `canonicalBarangaysPresent: 426`,
  `canonicalBarangaysMissing: 0`, `completeLgus: 15`, and an empty
  `incompleteLgus` list. Repeating the apply should propose zero inserts. Run
  the read-only verification SQL below against the same fresh database.

For the reviewed dry run (264 existing rows, 229 exact matches, and the five
listed unique aliases), expect `barangaysToCreate: 192`,
`barangaysCreated: 0`, and 30 legacy-only records:
`229 + 5 + 192 = 426` canonical names, and `426 + 30 = 456` projected rows.
After import, the expected classification is 421 exact matches, five alias
matches, zero missing canonical names, and 30 legacy-only records, with
`barangaysCreated: 192`. Alias rows are reused by their existing IDs and
excluded from inserts; no rows are renamed or merged.

The form labels and counts do not depend on step 4, but pending names remain
disabled until their corresponding database rows exist. Only real database
IDs are accepted by the submission endpoints.

Existing historical names can leave the raw database count above 426. The
important completion check is that all 426 canonical names are present under
the intended 15 LGUs; the importer reports any alias conflicts and refuses to
merge records that may be referenced by users or other data. Exact matches,
unique alias matches, missing canonical names, blocked ambiguities, and
legacy-only rows are reported separately. Multiple candidate rows for a
canonical name are a conflict and block apply.

Read-only verification SQL for the **fresh Railway PostgreSQL** service:

```sql
SELECT m.name AS lgu, COUNT(b.id) AS barangays
FROM "Municipality" m
LEFT JOIN "Barangay" b ON b."municipalityId" = m.id
WHERE m.province = 'Oriental Mindoro'
GROUP BY m.id, m.name
ORDER BY m.name;

SELECT COUNT(DISTINCT m.id) AS lgus, COUNT(b.id) AS barangays
FROM "Municipality" m
LEFT JOIN "Barangay" b ON b."municipalityId" = m.id
WHERE m.province = 'Oriental Mindoro';

SELECT m.name, b.name
FROM "Municipality" m
JOIN "Barangay" b ON b."municipalityId" = m.id
WHERE m.province = 'Oriental Mindoro'
  AND m.name = 'Naujan'
  AND lower(b.name) IN ('magsaysay', 'villa magsaysay');
```

The deployed application and database import are separate rollout steps. A
local test passing does not establish that the Railway database has 426 rows.
