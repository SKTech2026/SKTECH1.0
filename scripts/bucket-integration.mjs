// Run only after verifying the isolated Railway bucket and obtaining separate approval.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function statusCode(error) {
  return typeof error === "object" && error !== null && "$metadata" in error
    ? error.$metadata?.httpStatusCode : undefined;
}

async function main() {
  // This script deliberately does not import dotenv or application configuration.
  if (process.execArgv.some((arg) => arg.startsWith("--env-file")) || process.env.NODE_OPTIONS) {
    throw new Error("Do not run this test with Node preload options or env files.");
  }
  assert.equal(requireValue("SKTECH_TEST_ENVIRONMENT"), "sktech-fresh");
  assert.equal(requireValue("SKTECH_BUCKET_TEST_APPROVED"), "YES");
  const bucket = requireValue("SKTECH_TEST_BUCKET_S3_NAME");
  assert.equal(requireValue("SKTECH_TEST_BUCKET_CONFIRMATION"), `sktech-fresh:${bucket}`);
  const endpoint = requireValue("SKTECH_TEST_BUCKET_ENDPOINT");
  const accessKeyId = requireValue("SKTECH_TEST_BUCKET_ACCESS_KEY_ID");
  const secretAccessKey = requireValue("SKTECH_TEST_BUCKET_SECRET_ACCESS_KEY");
  const region = requireValue("SKTECH_TEST_BUCKET_REGION");

  const { buildObjectKey, createObjectStorage } = await import("../src/lib/object-storage-core.ts");
  const storage = createObjectStorage({ endpoint, bucket, accessKeyId, secretAccessKey, region });
  const namespace = "sktech-public-news";
  const objectPath = `adapter-check/${randomUUID()}.txt`;
  const payload = Buffer.from(`SKTECH isolated bucket check ${randomUUID()}\n`);
  let created = false;
  try {
    await storage.upload(namespace, objectPath, payload, "text/plain");
    created = true;
    console.log(`Test object key for targeted cleanup: ${buildObjectKey(namespace, objectPath)}`);
    console.log("PASS: unique object upload");

    let duplicateRejected = false;
    try {
      await storage.upload(namespace, objectPath, Buffer.from("replacement"), "text/plain");
    } catch (error) {
      duplicateRejected = statusCode(error) === 412 || statusCode(error) === 409;
    }
    assert.ok(duplicateRejected, "Conditional second upload was not rejected as expected.");
    console.log("PASS: conditional overwrite rejected");

    const original = await storage.download(namespace, objectPath);
    assert.equal(original.type, "text/plain");
    assert.deepEqual(Buffer.from(await original.arrayBuffer()), payload);
    console.log("PASS: authenticated download matches original");

    const base = new URL(endpoint);
    const anonymousUrl = new URL(`${base.protocol}//${bucket}.${base.host}/${buildObjectKey(namespace, objectPath)}`);
    const anonymousResponse = await fetch(anonymousUrl, { redirect: "manual" });
    assert.ok([403, 404].includes(anonymousResponse.status), "Anonymous read was not denied.");
    console.log("PASS: anonymous read denied");
  } finally {
    if (created) {
      try {
        await storage.remove(namespace, objectPath);
        console.log("PASS: unique test object deleted");
        let missing = false;
        try { await storage.download(namespace, objectPath); }
        catch (error) { missing = statusCode(error) === 404; }
        assert.ok(missing, "Deleted object is still accessible or deletion was not confirmed.");
        console.log("PASS: deleted object unavailable");
      } catch {
        console.error("FAIL: cleanup or deletion verification failed; inspect only this run's unique test object.");
        process.exitCode = 1;
      }
    }
    storage.close();
  }
}

main().catch((error) => {
  // Never print SDK exception messages: they may include endpoint or credential context.
  console.error(`FAIL: ${error instanceof assert.AssertionError ? "test assertion" : "test setup or operation"}.`);
  process.exitCode = 1;
});
