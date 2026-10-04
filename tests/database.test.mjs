import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database } from "../server/db.mjs";
import { applyMutation, validate } from "../server/network.mjs";
import { calculateRewards } from "../server/policy.mjs";
test(
  "real PostgreSQL: role isolation, capacity, verification, rewards and partner coordination",
  { skip: !process.env.DATABASE_URL },
  async () => {
    const client = await database().connect();
    const identity = (role) => ({
      id: `test-${role}-${randomUUID()}`,
      name: `Synthetic ${role}`,
      email: `${randomUUID()}@example.invalid`,
    });
    const donor = identity("donor"),
      otherDonor = identity("donor"),
      hospital = identity("hospital"),
      otherHospital = identity("hospital"),
      fractionator = identity("fractionator");
    process.env.NETWORK_ADMIN_USER_IDS = donor.id;
    const call = (actor, route, body) =>
      applyMutation(client, actor, route, validate(route, body));
    async function rejects(fn, status) {
      await client.query("SAVEPOINT rejected");
      try {
        await assert.rejects(fn, { status });
      } finally {
        await client.query("ROLLBACK TO SAVEPOINT rejected");
      }
    }
    try {
      await client.query("BEGIN");
      for (const actor of [donor, otherDonor])
        await call(actor, "enroll", {
          role: "donor",
          name: actor.name,
          city: "Synthetic city",
          age: 25,
          bloodGroup: "O+",
        });
      for (const actor of [hospital, otherHospital, fractionator])
        await call(actor, "enroll", {
          role: actor === fractionator ? "fractionator" : "hospital",
          name: actor.name,
          city: "Synthetic city",
          organization: actor.name,
          licenseNumber: "SYNTHETIC-TEST-ONLY",
        });
      const campBody = {
        title: "Rollback-only test camp",
        city: "Synthetic city",
        address: "Synthetic venue",
        startsAt: new Date(Date.now() + 86400000).toISOString(),
        endsAt: new Date(Date.now() + 90000000).toISOString(),
        capacity: 1,
        kind: "blood",
      };
      await rejects(() => call(hospital, "camp", campBody), 403);
      await rejects(() => call(donor, "camp", campBody), 403);
      for (const actor of [hospital, otherHospital, fractionator])
        await call(donor, "review", {
          id: actor.id,
          status: "approved",
          note: "Synthetic integration test, rolled back.",
        });
      const camp = await call(hospital, "camp", campBody);
      const booking = await call(donor, "book", { campId: camp.id });
      assert.equal(
        (await call(donor, "book", { campId: camp.id })).id,
        booking.id,
      );
      await rejects(() => call(otherDonor, "book", { campId: camp.id }), 409);
      await rejects(
        () =>
          call(otherHospital, "booking", {
            id: booking.id,
            status: "confirmed",
          }),
        404,
      );
      await rejects(
        () =>
          call(donor, "claim", {
            rewardId: "donor-certificate",
            consent: true,
          }),
        403,
      );
      await call(hospital, "booking", { id: booking.id, status: "confirmed" });
      const verification = {
        bookingId: booking.id,
        reference: `TEST-${randomUUID()}`,
        donatedAt: new Date().toISOString(),
        screened: true,
      };
      await rejects(() => call(donor, "verify", verification), 403);
      await rejects(() => call(hospital, "verify", verification), 400);
      await client.query(
        "UPDATE rudhira.camps SET starts_at=now()-interval '1 hour',ends_at=now()+interval '1 hour' WHERE id=$1",
        [camp.id],
      );
      const event = await call(hospital, "verify", verification);
      assert.equal((await call(hospital, "verify", verification)).id, event.id);
      const claim = await call(donor, "claim", {
        rewardId: "donor-certificate",
        consent: true,
      });
      assert.equal(claim.status, "fulfilled");
      assert.equal(
        (
          await call(donor, "claim", {
            rewardId: "donor-certificate",
            consent: true,
          })
        ).id,
        claim.id,
      );
    await rejects(
      () => call(donor, "claim", { rewardId: "advisory", consent: true }),
      403,
    );
    await rejects(()=>call(donor,'claim',{rewardId:'basic-health-panel',consent:true}),409);
    await rejects(()=>call(hospital,'program',{rewardId:'basic-health-panel',enabled:true,provider:'Synthetic provider',details:'Synthetic program, rolled back.'}),403);
    await call(donor,'program',{rewardId:'basic-health-panel',enabled:true,provider:'Synthetic provider',details:'Synthetic program, rolled back.'});
    const secondCamp=await call(hospital,'camp',{...campBody,title:'Second rollback-only camp'});
    const secondBooking=await call(donor,'book',{campId:secondCamp.id});
    await call(hospital,'booking',{id:secondBooking.id,status:'confirmed'});
    await client.query("UPDATE rudhira.camps SET starts_at=now()-interval '1 hour',ends_at=now()+interval '1 hour' WHERE id=$1",[secondCamp.id]);
    const secondEvent=await call(hospital,'verify',{bookingId:secondBooking.id,reference:`TEST-${randomUUID()}`,donatedAt:new Date().toISOString(),screened:true});
    assert.equal((await call(donor,'claim',{rewardId:'basic-health-panel',consent:true})).status,'requested');
    await call(donor,'void',{id:secondEvent.id,reason:'Synthetic rollback test'});
      const request = await call(fractionator, "plasma", {
        title: "Rollback-only plasma request",
        city: "Synthetic city",
        litres: 20,
        requiredBy: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        requirements: "Synthetic quality requirements.",
      });
      await rejects(
        () =>
          call(donor, "respond", {
            requestId: request.id,
            message: "Invalid role",
          }),
        403,
      );
      const response = await call(hospital, "respond", {
        requestId: request.id,
        message: "Synthetic response.",
      });
      await call(fractionator, "response", {
        id: response.id,
        status: "accepted",
      });
      await call(fractionator, "closeRequest", { id: request.id });
      await rejects(
        () =>
          call(otherHospital, "respond", {
            requestId: request.id,
            message: "Closed request",
          }),
        404,
      );
      await call(donor, "void", {
        id: event.id,
        reason: "Synthetic rollback test",
      });
      const { rows } = await client.query(
        "SELECT kind,donated_at,status FROM rudhira.donations WHERE donor_id=$1",
        [donor.id],
      );
      assert.equal(calculateRewards(rows).count, 0);
      await call(donor, "review", {
        id: hospital.id,
        status: "suspended",
        note: "Synthetic suspension",
      });
      await rejects(() => call(hospital, "camp", campBody), 403);
      const {
        rows: [audit],
      } = await client.query(
        "SELECT count(*)::int AS count FROM rudhira.audit_log WHERE actor_id=$1",
        [donor.id],
      );
      assert.ok(audit.count >= 5);
    } finally {
      await client.query("ROLLBACK");
      client.release();
      await database().end();
    }
  },
);
