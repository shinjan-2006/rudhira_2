import { createRemoteJWKSet, jwtVerify } from "jose";
import { query } from "./db.mjs";
import { HttpError } from "./policy.mjs";
let jwks;
export async function authenticate(req) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "Please sign in to continue.");
  const base = process.env.NEON_AUTH_BASE_URL;
  if (!base || base === "[SENSITIVE]")
    throw new HttpError(503, "Authentication is not configured.");
  try {
    jwks ||= createRemoteJWKSet(
      new URL(`${base.replace(/\/$/, "")}/.well-known/jwks.json`),
    );
    const { payload } = await jwtVerify(token, jwks, {
      issuer: process.env.NEON_AUTH_ISSUER || new URL(base).origin,
      requiredClaims: ["sub", "exp", "iat"],
      algorithms: ["EdDSA", "RS256", "ES256"],
    });
    if (!payload.sub || payload.role === "anonymous")
      throw new Error("Invalid identity");
    const { rows } = await query(
      'SELECT id, name, email, "emailVerified", banned FROM neon_auth."user" WHERE id=$1',
      [payload.sub],
    );
    if (!rows[0]) throw new HttpError(401, "Your account is unavailable.");
    if (rows[0].banned)
      throw new HttpError(
        403,
        "Your account is unavailable. Contact the network administrator.",
      );
    if (!rows[0].emailVerified)
      throw new HttpError(403, "Verify your email before joining the network.");
    return rows[0];
  } catch (e) {
    if (e instanceof HttpError) throw e;
    if (
      e.code?.startsWith("ERR_J") ||
      /claim|JWT|signature|Invalid identity/i.test(e.message)
    )
      throw new HttpError(
        401,
        "Your session has expired. Please sign in again.",
      );
    throw e;
  }
}
