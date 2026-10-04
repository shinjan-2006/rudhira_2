# Rudhira network

The 3D experience remains at `/`. The live network is `/network` (or `/network.html`) with separate donor, hospital and plasma fractionator entry points. The two pages share brand styling without loading the 3D scene in account dashboards.

## Backend

- Neon Managed Better Auth provides email/password authentication, email verification codes, password reset and sessions. Passwords never enter Rudhira's application database.
- Vercel's `/api/network` function verifies each bearer JWT against the configured Neon JWKS and issuer, checks the canonical verified user, then applies database-owned role and organization approval checks.
- Neon Postgres stores profiles, camps, bookings, verified donations, reward claims, plasma requirements, hospital responses, benefit programs and an audit trail. The private `rudhira` schema has RLS enabled with no public policies; only the server's database owner connection accesses it.
- A profile belongs to one role. Public signup cannot select approval or administrator status. Hospitals and fractionators start pending. Administrator access comes only from `NETWORK_ADMIN_EMAILS` or `NETWORK_ADMIN_USER_IDS` in server configuration. An email must be verified by Neon before it can match the administrator allowlist.
- Only approved hospitals can confirm their own camps' bookings and verify completed donations. A booking can produce one donation record, and a hospital reference is unique. Camp reservations use row locks to prevent oversubscription. Duplicate booking and certificate requests return the existing record.
- Fractionators see organization-level plasma conversations, not donor profiles or clinical records. Coordination requests do not execute material transfers or sales.
- Mutation routes validate strict input schemas, cap request size, check request origins and enforce a per-account database rate limit. Audit logs contain actor/action/resource identifiers; application error logs contain request IDs and error codes, never request bodies, tokens or credentials.

## Rewards

Recognition uses verified, non-void donations in a rolling year: Bronze at 1, Silver at 2–3, Gold at 4+, Plasma Elite at 6+ plasma/apheresis donations. These thresholds describe recognition, never donation eligibility or a recommended donation frequency. A hospital's clinical process determines whether and when someone may donate.

Certificates are issued immediately after a qualifying verified record. Community, story and advisory requests require administrator fulfillment; a story still requires separate publication consent. Requests are unique per donor, reward and calendar year.

The old site's basic health panel, comprehensive health panel and plasma health program are implemented as disabled partner benefits. An administrator must explicitly name the approved provider and describe agreed services before enabling claims. No cash rewards or automatic health/insurance promises are made. Voiding a donation recalculates the donor's current tier and prevents certificates without a remaining verified contribution. Historical claim records remain auditable.

## Configuration and development

1. Link the existing Vercel project and connect Neon through the Marketplace. Configure authentication and database variables before migrations or the dev server. Never commit `.env*` files except the placeholder `.env.example`.
2. Configure the trusted live domain in Neon Auth, require verification codes and disable localhost for the production auth branch. Use a separate development branch for local authenticated testing.
3. Set `NETWORK_ADMIN_EMAILS` to the owner's verified email or `NETWORK_ADMIN_USER_IDS` to an exact trusted auth user ID. Without this allowlist the administrator console is inaccessible; no first-user promotion exists.
4. Install root and `experience` dependencies. Node 24 is supported.
5. Run `npm run db:migrate` with local database credentials in the ignored `.env.database.local`. Migrations are transactional and recorded in `public.rudhira_migrations`. Apply new migrations before deployment.
6. Run `npm run dev:api`, then the Vite dev server in `experience`. Vite proxies `/api` to port 8001.
7. Build with `npm run build`. Vercel installs both dependency sets, builds into `website` and serves the root `api/network.js` function.

## API routes

All routes use `/api/network?route=NAME`. Public `GET public` returns published camps and the reward catalog. `GET health` checks database readiness. Authenticated `GET dashboard`, `GET admin` and `GET certificate&id=UUID` return role-scoped data. Mutations are JSON `POST` requests with a bearer token:

| Route | Actor | Behavior |
|---|---|---|
| enroll | Verified identity | Create immutable-role profile |
| camp / closeCamp | Approved hospital | Publish or cancel own camp |
| book / booking | Donor or approved hospital | Reserve, cancel, confirm or decline scoped booking |
| verify | Approved hospital | Verify own camp's completed contribution |
| claim | Donor | Claim available reward for verified tier |
| plasma / closeRequest | Approved fractionator | Publish or close own requirements |
| respond | Approved hospital | Respond once to an open requirement |
| response | Approved fractionator | Accept or decline own requirement's response |
| review / fulfill / program / void | Allowlisted administrator | Review partners, fulfill recognition, configure benefits, void incorrect contribution |

## Verification

`npm test` checks tier boundaries, rolling windows, role isolation and strict input validation. `npm run test:db` exercises enrollment, partner approval, booking capacity, hospital ownership, verified donations, duplicate prevention, rewards, partner coordination and suspension against real PostgreSQL. All synthetic records live inside a transaction that is rolled back, including on failure.

The free shared Neon email sender supports verification/reset codes but is rate-limited. Configure a custom SMTP sender before broad public onboarding. This implementation is an operational network portal, not a clinical screening system, blood inventory system or licensed material-transfer system. Real partner verification, clinical operations and benefit availability remain the responsibility of the operator.
