import { authenticate } from "../server/auth.mjs";
import { query } from "../server/db.mjs";
import {
  publicData,
  dashboard,
  adminData,
  mutate,
  certificate,
} from "../server/network.mjs";
import { HttpError } from "../server/policy.mjs";
import { randomUUID } from "node:crypto";
export default async function handler(req, res) {
  const requestId = randomUUID();
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Request-Id", requestId);
  try {
    const url = new URL(req.url, "https://rudhira.invalid");
    const route = url.searchParams.get("route") || "public";
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      throw new HttpError(405, "Method not allowed.");
    }
    if (req.method === "GET" && route === "health") {
      await query("SELECT 1 FROM rudhira.profiles LIMIT 1");
      return res.status(200).json({ ok: true });
    }
    if (req.method === "GET" && route === "public")
      return res.status(200).json(await publicData());
    const identity = await authenticate(req);
    if (req.method === "GET") {
      if (route === "dashboard")
        return res.status(200).json(await dashboard(identity));
      if (route === "admin")
        return res.status(200).json(await adminData(identity));
      if (route === "certificate")
        return res
          .status(200)
          .json(await certificate(identity, url.searchParams.get("id")));
      throw new HttpError(404, "Page not found.");
    }
    const allowed = (
      process.env.APP_ORIGINS || "https://rudhira-2-experience.vercel.app"
    ).split(",");
    if (req.headers.origin && !allowed.includes(req.headers.origin))
      throw new HttpError(403, "Request origin is not allowed.");
    if (!req.headers["content-type"]?.startsWith("application/json"))
      throw new HttpError(415, "Use JSON for this request.");
    if (
      Number(req.headers["content-length"] || 0) > 16384 ||
      JSON.stringify(req.body || {}).length > 16384
    )
      throw new HttpError(413, "This request is too large.");
    const bucket = Math.floor(Date.now() / 60000);
    const {
      rows: [limit],
    } = await query(
      "INSERT INTO rudhira.rate_limits(account_id,bucket,hits) VALUES($1,$2,1) ON CONFLICT(account_id,bucket) DO UPDATE SET hits=rudhira.rate_limits.hits+1 RETURNING hits",
      [identity.id, bucket],
    );
    if (limit.hits > 30) {
      res.setHeader("Retry-After", "60");
      throw new HttpError(429, "Too many requests. Please wait a minute.");
    }
    // Bounded retention; cleanup never includes business records.
    await query("DELETE FROM rudhira.rate_limits WHERE bucket<$1", [
      bucket - 60,
    ]);
    return res.status(200).json(await mutate(identity, route, req.body));
  } catch (e) {
    const status =
      e instanceof HttpError ? e.status : e.code === "23505" ? 409 : 500;
    if (status === 500)
      console.error(JSON.stringify({ requestId, code: e.code || e.name }));
    return res
      .status(status)
      .json({
        error:
          e instanceof HttpError
            ? e.message
            : status === 409
              ? "This record already exists."
              : "The service is temporarily unavailable. Please try again.",
        requestId,
      });
  }
}
