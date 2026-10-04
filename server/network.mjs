import { z } from "zod";
import { query, transaction } from "./db.mjs";
import {
  HttpError,
  requireRole,
  requireAdmin,
  isAdmin,
  calculateRewards,
  rewardCatalog,
  tierRank,
} from "./policy.mjs";
const text = (max) => z.string().trim().min(1).max(max);
const uuid = z.string().uuid();
const kind = z.enum(["blood", "plasma", "apheresis"]);
const schemas = {
  program: z
    .object({
      rewardId: z.enum([
        "basic-health-panel",
        "comprehensive-health-panel",
        "plasma-health-program",
      ]),
      enabled: z.boolean(),
      provider: text(180),
      details: text(1500),
    })
    .strict(),
  enroll: z.discriminatedUnion("role", [
    z
      .object({
        role: z.literal("donor"),
        name: text(120),
        city: text(100),
        age: z.number().int().min(18).max(100),
        bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
      })
      .strict(),
    z
      .object({
        role: z.literal("hospital"),
        name: text(120),
        city: text(100),
        organization: text(180),
        licenseNumber: text(100),
      })
      .strict(),
    z
      .object({
        role: z.literal("fractionator"),
        name: text(120),
        city: text(100),
        organization: text(180),
        licenseNumber: text(100),
      })
      .strict(),
  ]),
  camp: z
    .object({
      title: text(160),
      city: text(100),
      address: text(300),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
      capacity: z.number().int().min(1).max(1000),
      kind,
    })
    .strict(),
  book: z.object({ campId: uuid }).strict(),
  booking: z
    .object({
      id: uuid,
      status: z.enum(["confirmed", "declined", "cancelled"]),
    })
    .strict(),
  verify: z
    .object({
      bookingId: uuid,
      reference: text(100),
      donatedAt: z.string().datetime(),
      screened: z.literal(true),
    })
    .strict(),
  claim: z
    .object({
      rewardId: z.enum(rewardCatalog.map((x) => x.id)),
      consent: z.literal(true),
    })
    .strict(),
  plasma: z
    .object({
      title: text(160),
      city: text(100),
      litres: z.number().int().min(1).max(100000),
      requiredBy: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      requirements: text(2000),
    })
    .strict(),
  respond: z.object({ requestId: uuid, message: text(1000) }).strict(),
  response: z
    .object({ id: uuid, status: z.enum(["accepted", "declined"]) })
    .strict(),
  closeRequest: z.object({ id: uuid }).strict(),
  closeCamp: z.object({ id: uuid }).strict(),
  review: z
    .object({
      id: text(200),
      status: z.enum(["approved", "rejected", "suspended"]),
      note: text(1000),
    })
    .strict(),
  fulfill: z
    .object({ id: uuid, status: z.enum(["fulfilled", "declined"]) })
    .strict(),
  void: z.object({ id: uuid, reason: text(500) }).strict(),
};
export function validate(route, body) {
  if (!schemas[route]) throw new HttpError(404, "Action not found.");
  const result = schemas[route].safeParse(body);
  if (!result.success)
    throw new HttpError(
      400,
      result.error.issues
        .map((x) => `${x.path.join(".") || "Form"}: ${x.message}`)
        .join("; "),
    );
  return result.data;
}
async function audit(client, identity, action, id) {
  await client.query(
    "INSERT INTO rudhira.audit_log(actor_id,action,resource_id) VALUES($1,$2,$3)",
    [identity.id, action, String(id)],
  );
}
async function catalog(client = { query }) {
  const { rows } = await client.query(
    "SELECT reward_id,enabled,provider,details FROM rudhira.benefit_programs",
  );
  return rewardCatalog.map((reward) => ({
    ...reward,
    ...(reward.kind === "health"
      ? rows.find((x) => x.reward_id === reward.id) || {}
      : { enabled: true }),
  }));
}
export async function publicData() {
  const { rows: camps } = await query(
    `SELECT c.*,p.organization FROM rudhira.camps c JOIN rudhira.profiles p ON p.id=c.hospital_id WHERE c.status='open' AND c.ends_at>now() AND p.status='approved' ORDER BY c.starts_at LIMIT 100`,
  );
  return { camps, rewardCatalog: await catalog() };
}
export async function dashboard(identity) {
  const {
    rows: [profile],
  } = await query("SELECT * FROM rudhira.profiles WHERE id=$1", [identity.id]);
  const admin = isAdmin(identity);
  if (profile?.status === "suspended")
    throw new HttpError(
      403,
      "Your account is suspended. Contact the network administrator.",
    );
  if (!profile)
    return {
      profile: null,
      identity: { id: identity.id, name: identity.name, email: identity.email },
      isAdmin: admin,
    };
  let data = { profile, isAdmin: admin, rewardCatalog: await catalog() };
  if (profile.role === "donor") {
    const [donations, bookings, claims, available] = await Promise.all([
      query(
        `SELECT d.*,p.organization FROM rudhira.donations d JOIN rudhira.profiles p ON p.id=d.hospital_id WHERE d.donor_id=$1 ORDER BY d.donated_at DESC LIMIT 200`,
        [identity.id],
      ),
      query(
        `SELECT b.*,c.title,c.city,c.address,c.starts_at,c.ends_at,c.kind,c.status AS camp_status,p.organization FROM rudhira.bookings b JOIN rudhira.camps c ON c.id=b.camp_id JOIN rudhira.profiles p ON p.id=c.hospital_id WHERE b.donor_id=$1 ORDER BY b.created_at DESC LIMIT 100`,
        [identity.id],
      ),
      query(
        "SELECT * FROM rudhira.reward_claims WHERE donor_id=$1 ORDER BY created_at DESC LIMIT 100",
        [identity.id],
      ),
      publicData(),
    ]);
    // Count all events within the rolling year even when history is paginated.
    const { rows: recent } = await query(
      "SELECT kind,donated_at,status FROM rudhira.donations WHERE donor_id=$1 AND donated_at>now()-interval '1 year'",
      [identity.id],
    );
    data = {
      ...data,
      donations: donations.rows,
      bookings: bookings.rows,
      claims: claims.rows,
      camps: available.camps,
      rewards: calculateRewards(recent),
    };
  } else if (profile.status === "approved") {
    if (profile.role === "hospital") {
      const [camps, bookings, requests, responses] = await Promise.all([
        query(
          "SELECT * FROM rudhira.camps WHERE hospital_id=$1 ORDER BY starts_at DESC LIMIT 100",
          [identity.id],
        ),
        query(
          `SELECT b.*,c.title,c.kind,c.starts_at,c.ends_at,c.status AS camp_status,p.name AS donor_name,p.blood_group,p.id AS donor_id FROM rudhira.bookings b JOIN rudhira.camps c ON c.id=b.camp_id JOIN rudhira.profiles p ON p.id=b.donor_id WHERE c.hospital_id=$1 ORDER BY b.created_at DESC LIMIT 200`,
          [identity.id],
        ),
        query(
          `SELECT r.*,p.organization FROM rudhira.plasma_requests r JOIN rudhira.profiles p ON p.id=r.fractionator_id WHERE r.status='open' AND p.status='approved' ORDER BY r.required_by LIMIT 100`,
        ),
        query(
          "SELECT * FROM rudhira.partner_responses WHERE hospital_id=$1 ORDER BY created_at DESC LIMIT 100",
          [identity.id],
        ),
      ]);
      data = {
        ...data,
        camps: camps.rows,
        bookings: bookings.rows,
        requests: requests.rows,
        responses: responses.rows,
      };
    } else {
      const [requests, responses] = await Promise.all([
        query(
          "SELECT * FROM rudhira.plasma_requests WHERE fractionator_id=$1 ORDER BY created_at DESC LIMIT 100",
          [identity.id],
        ),
        query(
          `SELECT s.*,r.title,p.organization,p.city FROM rudhira.partner_responses s JOIN rudhira.plasma_requests r ON r.id=s.request_id JOIN rudhira.profiles p ON p.id=s.hospital_id WHERE r.fractionator_id=$1 ORDER BY s.created_at DESC LIMIT 200`,
          [identity.id],
        ),
      ]);
      data = { ...data, requests: requests.rows, responses: responses.rows };
    }
  }
  return data;
}
export async function adminData(identity) {
  requireAdmin(identity);
  const [partners, claims, audits, donations] = await Promise.all([
    query(
      "SELECT id,name,email,city,role,organization,license_number,status,review_note,created_at FROM rudhira.profiles WHERE role<>'donor' ORDER BY created_at DESC LIMIT 200",
    ),
    query(
      "SELECT c.*,p.name FROM rudhira.reward_claims c JOIN rudhira.profiles p ON p.id=c.donor_id ORDER BY c.created_at DESC LIMIT 200",
    ),
    query("SELECT * FROM rudhira.audit_log ORDER BY created_at DESC LIMIT 100"),
    query(
      "SELECT d.*,p.name AS donor_name,h.organization FROM rudhira.donations d JOIN rudhira.profiles p ON p.id=d.donor_id JOIN rudhira.profiles h ON h.id=d.hospital_id ORDER BY d.donated_at DESC LIMIT 100",
    ),
  ]);
  return {
    programs: await catalog(),
    partners: partners.rows,
    claims: claims.rows,
    audits: audits.rows,
    donations: donations.rows,
  };
}
export async function certificate(identity, claimId) {
  if (!uuid.safeParse(claimId).success)
    throw new HttpError(400, "Invalid certificate.");
  const {
    rows: [claim],
  } = await query(
    "SELECT c.*,p.name FROM rudhira.reward_claims c JOIN rudhira.profiles p ON p.id=c.donor_id WHERE c.id=$1 AND c.donor_id=$2 AND c.reward_id='donor-certificate' AND c.status='fulfilled'",
    [claimId, identity.id],
  );
  if (!claim) throw new HttpError(404, "Certificate not found.");
  const {
    rows: [event],
  } = await query(
    "SELECT id,donated_at FROM rudhira.donations WHERE donor_id=$1 AND status='verified' ORDER BY donated_at DESC LIMIT 1",
    [identity.id],
  );
  if (!event)
    throw new HttpError(
      409,
      "No verified donation is available for this certificate.",
    );
  return {
    id: claim.id,
    name: claim.name,
    issuedAt: claim.created_at,
    donatedAt: event.donated_at,
    tier: claim.tier_at_claim,
  };
}
export async function mutate(identity, route, raw) {
  const body = validate(route, raw);
  return transaction((client) => applyMutation(client, identity, route, body));
}
// Every mutation rechecks canonical database roles and approval status while holding an account lock.
export async function applyMutation(client, identity, route, body) {
  const {
    rows: [profile],
  } = await client.query(
    "SELECT * FROM rudhira.profiles WHERE id=$1 FOR UPDATE",
    [identity.id],
  );
  if (profile?.status === "suspended")
    throw new HttpError(403, "Your account is suspended.");
  if (route === "enroll") {
    if (profile)
      throw new HttpError(
        409,
        "This account already has a role. Sign in to its dashboard.",
      );
    const {
      rows: [row],
    } = await client.query(
      `INSERT INTO rudhira.profiles(id,role,name,email,city,age,blood_group,organization,license_number,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        identity.id,
        body.role,
        body.name,
        identity.email,
        body.city,
        body.age || null,
        body.bloodGroup || null,
        body.organization || null,
        body.licenseNumber || null,
        body.role === "donor" ? "active" : "pending",
      ],
    );
    await audit(client, identity, "account.enrolled", identity.id);
    return row;
  }
  if (route === "camp") {
    requireRole(profile, "hospital", true);
    if (
      new Date(body.startsAt) <= new Date() ||
      new Date(body.endsAt) <= new Date(body.startsAt)
    )
      throw new HttpError(
        400,
        "Use a future start and an end after the start.",
      );
    const {
      rows: [row],
    } = await client.query(
      "INSERT INTO rudhira.camps(hospital_id,title,city,address,starts_at,ends_at,capacity,kind) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
      [
        identity.id,
        body.title,
        body.city,
        body.address,
        body.startsAt,
        body.endsAt,
        body.capacity,
        body.kind,
      ],
    );
    await audit(client, identity, "camp.created", row.id);
    return row;
  }
  if (route === "book") {
    requireRole(profile, "donor");
    const {
      rows: [camp],
    } = await client.query(
      "SELECT c.* FROM rudhira.camps c JOIN rudhira.profiles p ON p.id=c.hospital_id WHERE c.id=$1 AND c.status='open' AND c.ends_at>now() AND p.status='approved' FOR UPDATE OF c",
      [body.campId],
    );
    if (!camp)
      throw new HttpError(404, "This camp is no longer accepting requests.");
    const {
      rows: [existing],
    } = await client.query(
      "SELECT * FROM rudhira.bookings WHERE donor_id=$1 AND camp_id=$2",
      [identity.id, camp.id],
    );
    if (
      existing &&
      ["requested", "confirmed", "completed"].includes(existing.status)
    )
      return existing;
    const {
      rows: [count],
    } = await client.query(
      "SELECT count(*)::int AS count FROM rudhira.bookings WHERE camp_id=$1 AND status IN ('requested','confirmed','completed')",
      [camp.id],
    );
    if (count.count >= camp.capacity)
      throw new HttpError(
        409,
        "This camp is full. Please choose another camp.",
      );
    const {
      rows: [row],
    } = await client.query(
      "INSERT INTO rudhira.bookings(donor_id,camp_id) VALUES($1,$2) ON CONFLICT(donor_id,camp_id) DO UPDATE SET status='requested',created_at=now() RETURNING *",
      [identity.id, camp.id],
    );
    await audit(client, identity, "booking.requested", row.id);
    return row;
  }
  if (route === "booking" || route === "verify") {
    const id = body.id || body.bookingId;
    // Read camp identity first, then lock the camp before the booking consistently with cancellation.
    const {
      rows: [info],
    } = await client.query("SELECT camp_id FROM rudhira.bookings WHERE id=$1", [
      id,
    ]);
    if (!info) throw new HttpError(404, "Booking not found.");
    const {
      rows: [camp],
    } = await client.query(
      "SELECT * FROM rudhira.camps WHERE id=$1 FOR UPDATE",
      [info.camp_id],
    );
    const {
      rows: [booking],
    } = await client.query(
      "SELECT * FROM rudhira.bookings WHERE id=$1 FOR UPDATE",
      [id],
    );
    if (route === "booking" && body.status === "cancelled") {
      requireRole(profile, "donor");
      if (booking.donor_id !== identity.id)
        throw new HttpError(404, "Booking not found.");
      if (!["requested", "confirmed", "cancelled"].includes(booking.status))
        throw new HttpError(409, "This booking cannot be cancelled.");
    } else {
      requireRole(profile, "hospital", true);
      if (camp.hospital_id !== identity.id)
        throw new HttpError(404, "Booking not found.");
      if (camp.status !== "open")
        throw new HttpError(409, "This camp is closed.");
      if (route === "verify") {
        if (booking.status === "completed") {
          const {
            rows: [existing],
          } = await client.query(
            "SELECT * FROM rudhira.donations WHERE booking_id=$1",
            [id],
          );
          if (existing?.reference === body.reference) return existing;
          throw new HttpError(409, "This donation has already been recorded.");
        }
        if (booking.status !== "confirmed")
          throw new HttpError(
            409,
            "Confirm the booking before recording a donation.",
          );
        const date = new Date(body.donatedAt),
          latest = new Date(new Date(camp.ends_at).getTime() + 86400000);
        if (
          date > new Date() ||
          date < new Date(camp.starts_at) ||
          date > latest
        )
          throw new HttpError(
            400,
            "The donation date must be within the camp dates and cannot be in the future.",
          );
        const {
          rows: [row],
        } = await client.query(
          "INSERT INTO rudhira.donations(booking_id,donor_id,hospital_id,kind,donated_at,reference) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
          [id, booking.donor_id, identity.id, camp.kind, date, body.reference],
        );
        await client.query(
          "UPDATE rudhira.bookings SET status='completed' WHERE id=$1",
          [id],
        );
        await audit(client, identity, "donation.verified", row.id);
        return row;
      }
      if (!["requested", "confirmed"].includes(booking.status))
        throw new HttpError(409, "This booking can no longer be changed.");
    }
    const {
      rows: [row],
    } = await client.query(
      "UPDATE rudhira.bookings SET status=$1 WHERE id=$2 RETURNING *",
      [body.status, id],
    );
    await audit(client, identity, `booking.${body.status}`, id);
    return row;
  }
  if (route === "closeCamp") {
    requireRole(profile, "hospital", true);
    const {
      rows: [camp],
    } = await client.query(
      "SELECT * FROM rudhira.camps WHERE id=$1 AND hospital_id=$2 FOR UPDATE",
      [body.id, identity.id],
    );
    if (!camp) throw new HttpError(404, "Camp not found.");
    await client.query(
      "UPDATE rudhira.camps SET status='cancelled' WHERE id=$1",
      [body.id],
    );
    await client.query(
      "UPDATE rudhira.bookings SET status='cancelled' WHERE camp_id=$1 AND status IN ('requested','confirmed')",
      [body.id],
    );
    await audit(client, identity, "camp.cancelled", body.id);
    return { ok: true };
  }
  if (route === "claim") {
    requireRole(profile, "donor");
    const { rows } = await client.query(
      "SELECT kind,donated_at,status FROM rudhira.donations WHERE donor_id=$1 AND donated_at>now()-interval '1 year'",
      [identity.id],
    );
    const rewards = calculateRewards(rows),
      reward = (await catalog(client)).find((x) => x.id === body.rewardId);
    if (!reward.enabled)
      throw new HttpError(
        409,
        "This partner program is not currently available.",
      );
    if (tierRank[rewards.tier] < tierRank[reward.tier])
      throw new HttpError(
        403,
        "This reward is not yet available for your verified tier.",
      );
    const {
      rows: [row],
    } = await client.query(
      `INSERT INTO rudhira.reward_claims(donor_id,reward_id,year,tier_at_claim,status) VALUES($1,$2,$3,$4,$5) ON CONFLICT(donor_id,reward_id,year) DO UPDATE SET donor_id=excluded.donor_id RETURNING *`,
      [
        identity.id,
        reward.id,
        new Date().getUTCFullYear(),
        rewards.tier,
        reward.kind === "certificate" ? "fulfilled" : "requested",
      ],
    );
    await audit(client, identity, "reward.claimed", row.id);
    return row;
  }
  if (route === "plasma") {
    requireRole(profile, "fractionator", true);
    if (
      !Number.isFinite(Date.parse(body.requiredBy)) ||
      body.requiredBy < new Date().toISOString().slice(0, 10)
    )
      throw new HttpError(400, "Choose a current or future required date.");
    const {
      rows: [row],
    } = await client.query(
      "INSERT INTO rudhira.plasma_requests(fractionator_id,title,city,litres,required_by,requirements) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
      [
        identity.id,
        body.title,
        body.city,
        body.litres,
        body.requiredBy,
        body.requirements,
      ],
    );
    await audit(client, identity, "plasma.requested", row.id);
    return row;
  }
  if (route === "respond") {
    requireRole(profile, "hospital", true);
    const {
      rows: [request],
    } = await client.query(
      "SELECT r.* FROM rudhira.plasma_requests r JOIN rudhira.profiles p ON p.id=r.fractionator_id WHERE r.id=$1 AND r.status='open' AND p.status='approved' FOR UPDATE OF r",
      [body.requestId],
    );
    if (!request) throw new HttpError(404, "This request is no longer open.");
    const {
      rows: [row],
    } = await client.query(
      `INSERT INTO rudhira.partner_responses(request_id,hospital_id,message) VALUES($1,$2,$3) ON CONFLICT(request_id,hospital_id) DO NOTHING RETURNING *`,
      [body.requestId, identity.id, body.message],
    );
    if (!row)
      throw new HttpError(409, "You have already responded to this request.");
    await audit(client, identity, "plasma.responded", row.id);
    return row;
  }
  if (route === "response") {
    requireRole(profile, "fractionator", true);
    const {
      rows: [row],
    } = await client.query(
      `UPDATE rudhira.partner_responses s SET status=$1 FROM rudhira.plasma_requests r WHERE s.id=$2 AND r.id=s.request_id AND r.fractionator_id=$3 AND r.status='open' AND s.status='submitted' RETURNING s.*`,
      [body.status, body.id, identity.id],
    );
    if (!row) throw new HttpError(409, "This response cannot be changed.");
    await audit(client, identity, `plasma.response.${body.status}`, row.id);
    return row;
  }
  if (route === "closeRequest") {
    requireRole(profile, "fractionator", true);
    const {
      rows: [row],
    } = await client.query(
      "UPDATE rudhira.plasma_requests SET status='closed' WHERE id=$1 AND fractionator_id=$2 RETURNING *",
      [body.id, identity.id],
    );
    if (!row) throw new HttpError(404, "Request not found.");
    await audit(client, identity, "plasma.closed", row.id);
    return row;
  }
  if (["review", "fulfill", "void", "program"].includes(route)) {
    requireAdmin(identity);
    if (route === "program") {
      const {
        rows: [row],
      } = await client.query(
        "INSERT INTO rudhira.benefit_programs(reward_id,enabled,provider,details,updated_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(reward_id) DO UPDATE SET enabled=excluded.enabled,provider=excluded.provider,details=excluded.details,updated_by=excluded.updated_by,updated_at=now() RETURNING *",
        [body.rewardId, body.enabled, body.provider, body.details, identity.id],
      );
      await audit(client, identity, "reward.program.updated", body.rewardId);
      return row;
    }
    if (route === "review") {
      const {
        rows: [row],
      } = await client.query(
        `UPDATE rudhira.profiles SET status=$1,review_note=$2,reviewed_by=$3,reviewed_at=now(),updated_at=now() WHERE id=$4 AND role<>'donor' RETURNING *`,
        [body.status, body.note, identity.id, body.id],
      );
      if (!row) throw new HttpError(404, "Partner not found.");
      await audit(client, identity, `partner.${body.status}`, body.id);
      return row;
    }
    if (route === "fulfill") {
      const {
        rows: [row],
      } = await client.query(
        "UPDATE rudhira.reward_claims SET status=$1 WHERE id=$2 AND status='requested' RETURNING *",
        [body.status, body.id],
      );
      if (!row) throw new HttpError(409, "This claim is already resolved.");
      await audit(client, identity, `reward.${body.status}`, body.id);
      return row;
    }
    const {
      rows: [row],
    } = await client.query(
      "UPDATE rudhira.donations SET status='void',void_reason=$2 WHERE id=$1 AND status='verified' RETURNING *",
      [body.id, body.reason],
    );
    if (!row) throw new HttpError(404, "Donation not found.");
    await audit(client, identity, "donation.voided", body.id);
    return row;
  }
  throw new HttpError(404, "Action not found.");
}
