import assert from "node:assert/strict";
import test from "node:test";

import { allowedObjectNamespaces, buildObjectKey, createObjectStorage } from "../src/lib/object-storage-core.ts";
import { hasFileSignature, hasOfficeContainerSignature } from "../src/lib/file-signatures.ts";

test("only approved namespaces and well-formed paths form object keys", () => {
  for (const namespace of allowedObjectNamespaces) {
    assert.equal(buildObjectKey(namespace, "checks/example.txt"), `${namespace}/checks/example.txt`);
  }
  for (const [namespace, path] of [
    ["unknown", "file.txt"], ["admission-proofs", "../file.txt"],
    ["admission-proofs", "a/../file.txt"], ["admission-proofs", "/file.txt"],
    ["admission-proofs", "a//file.txt"], ["admission-proofs", "a\\file.txt"],
    ["admission-proofs", "a?file.txt"], ["admission-proofs", ""],
    ["admission-proofs", "a".repeat(513)],
  ]) assert.throws(() => buildObjectKey(namespace, path));
});

test("the storage client requires an HTTPS base endpoint without sending requests", () => {
  const credentials = { bucket: "test-only", accessKeyId: "dummy", secretAccessKey: "dummy", region: "auto" };
  assert.throws(() => createObjectStorage({ ...credentials, endpoint: "http://example.invalid" }));
  assert.throws(() => createObjectStorage({ ...credentials, endpoint: "https://example.invalid/path" }));
});

test("image and PDF signatures reject contradictory declarations", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  const pdf = Buffer.from("%PDF-1.7", "ascii");
  for (const [bytes, mime] of [[jpeg, "image/jpeg"], [png, "image/png"],
    [webp, "image/webp"], [pdf, "application/pdf"]]) {
    assert.ok(hasFileSignature(bytes, mime));
    assert.ok(!hasFileSignature(bytes, mime === "image/png" ? "image/jpeg" : "image/png"));
  }
  assert.ok(!hasFileSignature(Buffer.from("not a file"), "application/pdf"));
});

test("Office container headers reject contradictory legacy and ZIP formats", () => {
  const ole = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  for (const ext of ["doc", "xls", "ppt"]) {
    assert.ok(hasOfficeContainerSignature(ole, ext));
    assert.ok(!hasOfficeContainerSignature(zip, ext));
  }
  for (const ext of ["docx", "xlsx", "pptx"]) {
    assert.ok(hasOfficeContainerSignature(zip, ext));
    assert.ok(!hasOfficeContainerSignature(ole, ext));
  }
});
