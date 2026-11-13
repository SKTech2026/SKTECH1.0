# Oriental Mindoro geography import

The canonical dropdown dataset is the user-provided
`src/data/oriental-mindoro-dropdowns.json`: 14 municipalities, City of Calapan,
and 426 barangays. The names have not been independently verified against PSA.
The old `prisma/seed.js`
contains only 14 LGUs and 264 barangays and must not be used for geography.
The supplied Naujan list has 70 names and includes neither `Magsaysay` nor
`Villa Magsaysay`. Treat those as possible existing aliases for review; do not
add both or rename referenced records automatically.

Only the fresh Railway PostgreSQL public proxy is accepted. Provide these
variables in a protected process environment, without committing or printing
the URL:

- `RAILWAY_ENVIRONMENT_NAME=sktech-fresh`
- `RAILWAY_FRESH_DATABASE_HOST`: exact public proxy hostname for the fresh `Postgres` service
- `RAILWAY_FRESH_DATABASE_URL`: current public PostgreSQL connection URL for that service

After the code is approved, deployed, and the fresh Railway target is verified,
run `npm run seed` for a read-only preview of missing geography. Review the
per-LGU counts, `possibleAliases`, and conflicts. Only after resolving these
reports, run `npm run seed:geography:apply` to add missing
municipalities and barangays in one transaction. The importer never creates,
updates, or deletes users. It does not delete any existing geography records.
It uses the existing `Calapan City` row when present; it does not create a
second `City of Calapan` row or change foreign keys.
Run `npm run seed` again to confirm `canonicalBarangaysPresent: 426`,
`completeLgus: 15`, and an empty `incompleteLgus` list.

Existing historical names can leave the raw database count above 426. The
important completion check is that all 426 canonical names are present under
the intended 15 LGUs; the importer reports any alias conflicts and refuses to
merge records that may be referenced by users or other data.

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

The currently deployed admission form reads these database rows directly. A
local test passing does not establish that the Railway database has 426 rows.
