# Safe ID template activation retry

The customized template `sktech-provincial-id-modern-v1` must remain in the
database with all saved fields and assets. Do not recreate, reseed, or overwrite
it while diagnosing activation. The activation transaction changes only template
status, active flags, updater, and timestamps after validation succeeds.

Before deploying a fix, inspect the failed `POST /api/admin/id-template/activate`
request in the `sktech-fresh` / `SKTECH1.0` Railway service logs. Record the
timestamp, exception class, Prisma code, and failing operation privately. The
API logs only `ID_TEMPLATE_ACTIVATION_FAILURE` and a safe category after this
change is deployed; it never logs saved design content or credentials.

Run these **read-only** queries only after confirming the connection is the
fresh Railway PostgreSQL service:

```sql
SELECT t.id, t.status, t."isActive", t.version, t."updatedAt",
       COUNT(DISTINCT f.id) AS field_count,
       COUNT(DISTINCT a.id) AS asset_count
FROM "IdTemplate" t
LEFT JOIN "IdTemplateField" f ON f."templateId" = t.id
LEFT JOIN "IdTemplateAsset" a ON a."templateId" = t.id
WHERE t.id = 'sktech-provincial-id-modern-v1'
GROUP BY t.id;

SELECT t.id, t.status, t."isActive", t.version, t."updatedAt",
       COUNT(f.id) FILTER (WHERE f.side = 'FRONT') AS front_fields,
       COUNT(f.id) FILTER (WHERE f.side = 'BACK') AS back_fields
FROM "IdTemplate" t
LEFT JOIN "IdTemplateField" f ON f."templateId" = t.id
WHERE t."isActive" = true OR t.status = 'ACTIVE'
GROUP BY t.id;
```

After approval, deploy the tested branch, reload the Designer to refresh its
saved version, and click **Activate Template** once. If it fails, use the new
message and `ID_TEMPLATE_ACTIVATION_FAILURE` category to diagnose it before
retrying. Confirm the intended template is the sole `ACTIVE` / `isActive` row
and its field and asset counts match the pre-deployment query. Do not use a
default template or modify design fields to work around an activation error.
