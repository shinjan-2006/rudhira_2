import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateRewards,
  requireRole,
  requireAdmin,
} from "../server/policy.mjs";
import { validate } from "../server/network.mjs";
const now = new Date("2026-10-04T12:00:00Z");
const events = (count, kind = "blood") =>
  Array.from({ length: count }, () => ({
    kind,
    donated_at: "2026-06-01T12:00:00Z",
    status: "verified",
  }));
test("tiers require recent, verified contributions and Plasma Elite requires plasma", () => {
  assert.equal(calculateRewards([], now).tier, "welcome");
  assert.equal(calculateRewards(events(1), now).tier, "bronze");
  assert.equal(calculateRewards(events(3), now).tier, "silver");
  assert.equal(calculateRewards(events(6), now).tier, "gold");
  assert.equal(calculateRewards(events(6, "plasma"), now).tier, "plasma_elite");
  assert.equal(
    calculateRewards(events(6, "apheresis"), now).tier,
    "plasma_elite",
  );
  const invalid = [
    { kind: "plasma", status: "void", donated_at: "2026-06-01" },
    { kind: "blood", donated_at: "2025-10-04T12:00:00Z" },
    { kind: "blood", donated_at: "2027-01-01" },
  ];
  assert.equal(calculateRewards(invalid, now).count, 0);
});
test("role and organization approval are checked independently", () => {
  assert.throws(
    () => requireRole({ role: "donor", status: "active" }, "hospital", true),
    { status: 403 },
  );
  assert.throws(
    () =>
      requireRole({ role: "hospital", status: "pending" }, "hospital", true),
    { status: 403 },
  );
  assert.throws(
    () =>
      requireRole({ role: "hospital", status: "suspended" }, "hospital", true),
    { status: 403 },
  );
  requireRole({ role: "hospital", status: "approved" }, "hospital", true);
});
test("admin access cannot be self selected and enrollment rejects promotion fields", () => {
  process.env.NETWORK_ADMIN_USER_IDS = "owner-id";
  assert.throws(() => requireAdmin({ id: "attacker-id" }), { status: 403 });
  requireAdmin({ id: "owner-id" });
  process.env.NETWORK_ADMIN_EMAILS='owner@example.invalid';
  requireAdmin({id:'another-owner-id',email:'OWNER@example.invalid'});
  assert.throws(
    () =>
      validate("enroll", {
        role: "donor",
        name: "Test",
        city: "Test city",
        age: 25,
        bloodGroup: "O+",
        status: "approved",
      }),
    { status: 400 },
  );
  assert.throws(
    () =>
      validate("verify", {
        bookingId: "d5c669a4-ce8b-4e77-9994-92bbf62a47c8",
        reference: "R1",
        donatedAt: now.toISOString(),
        screened: false,
      }),
    { status: 400 },
  );
});
