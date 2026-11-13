# Oriental Mindoro geography import

The reference dataset is `src/data/oriental-mindoro-locations.ts`: 14
municipalities, Calapan City, and 426 barangays. The old `prisma/seed.js`
contains only 14 LGUs and 264 barangays and must not be used for geography.

Only the fresh Railway PostgreSQL public proxy is accepted. Provide these
variables in a protected process environment, without committing or printing
the URL:

- `RAILWAY_ENVIRONMENT_NAME=sktech-fresh`
- `RAILWAY_FRESH_DATABASE_HOST`: exact public proxy hostname for the fresh `Postgres` service
- `RAILWAY_FRESH_DATABASE_URL`: current public PostgreSQL connection URL for that service

Run `npm run seed` for a read-only preview of missing geography. Review the
counts and conflicts, then run `npm run seed:geography:apply` to add missing
municipalities and barangays in one transaction. The importer never creates,
updates, or deletes users. It does not delete any existing geography records.
Run `npm run seed` again to confirm zero missing barangays and 15 complete LGUs.

Existing historical names can leave the raw database count above 426. The
important completion check is that all 426 canonical names are present under
the intended 15 LGUs; the importer reports any alias conflicts and refuses to
merge records that may be referenced by users or other data.
