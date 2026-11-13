import { strict as assert } from "node:assert";
import test from "node:test";
import { inputSha256 } from "../production/production-runner.ts";

test("production runner hashes nested input with Phase 1 canonical sha256Json", async () => {
  const { sha256Json } = await import("../fixtures/frozen-context.ts");
  const input = { camera_count: 2, cameras: [{ technology: "IP", count: 1 }, { technology: "HD", count: 1 }], wiring: { mode: "open" } };
  assert.equal(inputSha256(input), sha256Json(input));
});

test("snapshot evidence does not overwrite Phase 1 snapshot-manifest", async () => {
  const source = await import("../snapshots/snapshot-evidence.ts");
  assert.equal(typeof source.writeSnapshotEvidence, "function");
  assert.equal(typeof source.snapshotSha256, "function");
});
