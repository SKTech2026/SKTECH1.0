# Isolated Railway Bucket integration test

Do not run this test until an operator has separately approved live requests to the `sktech-fresh` Bucket. The marker and confirmation variables below are guardrails, not proof that credentials belong to the fresh environment. Manually verify the Railway project, environment, Bucket service, actual S3 bucket name, endpoint, and credential source in the Railway dashboard before supplying them. Keep the production environment and its credentials out of the test process.

The harness does not read `.env` files, import application authentication or database modules, or use `DATABASE_URL`. Invoke it with plain `node scripts/bucket-integration.mjs`; do not use `--env-file`, Node preloads, or `railway run` against an unverified environment. Provide secrets through a restricted runner or a temporary process environment that does not write them to source control or shell history. Do not print the values.

Required test-only variables:

| Variable | Source or required value |
| --- | --- |
| `SKTECH_TEST_ENVIRONMENT` | Exactly `sktech-fresh` |
| `SKTECH_BUCKET_TEST_APPROVED` | Exactly `YES`, set only after separate approval |
| `SKTECH_TEST_BUCKET_S3_NAME` | The fresh Bucket service's `BUCKET` variable, not its display name |
| `SKTECH_TEST_BUCKET_CONFIRMATION` | Explicitly enter `sktech-fresh:<actual S3 bucket name>` after manual verification |
| `SKTECH_TEST_BUCKET_ENDPOINT` | Fresh Bucket's HTTPS base S3 endpoint |
| `SKTECH_TEST_BUCKET_ACCESS_KEY_ID` | Fresh Bucket access key ID |
| `SKTECH_TEST_BUCKET_SECRET_ACCESS_KEY` | Fresh Bucket secret access key |
| `SKTECH_TEST_BUCKET_REGION` | Fresh Bucket region, such as `auto` if shown by Railway |

The harness ignores the app's `RAILWAY_BUCKET_*` variables, so it cannot silently fall back to a production app configuration. If the Railway service or credential source cannot be independently verified, stop before setting the confirmation variable.

After approval, run `node scripts/bucket-integration.mjs` in the restricted, verified test environment. The harness creates one randomized text object under `sktech-public-news/adapter-check/`, checks that a second conditional upload cannot overwrite it, compares an authenticated download with the original bytes, checks that an anonymous request is denied, deletes only that unique key, and verifies it is unavailable. Expected output is a PASS line for each step; no secrets or endpoint URL are printed. A failed first upload never triggers deletion. After a successful first upload, cleanup runs even if a later assertion fails. If cleanup fails, use the printed unique object key for an authorized targeted cleanup; never list or delete the entire bucket.

The offline unit tests run with `node --test tests/object-storage-local.test.mjs` and require no Railway credentials. They cover key validation, endpoint validation, file signatures, and Office container signatures. They do not prove Railway's support for virtual-hosted URLs or conditional `PutObject`; the approved live test must establish that behavior.
