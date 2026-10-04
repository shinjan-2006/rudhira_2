export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireRole(profile, role, approved = false) {
  if (!profile || profile.role !== role)
    throw new HttpError(403, "This action is not available to your account.");
  if (profile.status === "suspended")
    throw new HttpError(
      403,
      "Your account is suspended. Contact the network administrator.",
    );
  if (approved && profile.status !== "approved")
    throw new HttpError(403, "Your organization must be approved first.");
}
export function requireAdmin(identity) {
  const ids = (process.env.NETWORK_ADMIN_USER_IDS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const emails = (process.env.NETWORK_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (
    !ids.includes(identity.id) &&
    !emails.includes(identity.email?.toLowerCase())
  )
    throw new HttpError(403, "Administrator access required.");
}
export function isAdmin(identity) {
  try {
    requireAdmin(identity);
    return true;
  } catch {
    return false;
  }
}
export function calculateRewards(donations, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const valid = donations.filter(
    (d) =>
      d.status !== "void" &&
      new Date(d.donated_at) > cutoff &&
      new Date(d.donated_at) <= now,
  );
  const count = valid.length;
  const plasma = valid.filter(
    (d) => d.kind === "plasma" || d.kind === "apheresis",
  ).length;
  const tier =
    plasma >= 6
      ? "plasma_elite"
      : count >= 4
        ? "gold"
        : count >= 2
          ? "silver"
          : count >= 1
            ? "bronze"
            : "welcome";
  const next = count === 0 ? 1 : count === 1 ? 2 : count < 4 ? 4 : null;
  return {
    tier,
    count,
    plasma,
    next,
    remaining: next === null ? null : Math.max(0, next - count),
    windowStart: cutoff.toISOString(),
  };
}
export const tierRank = {
  welcome: 0,
  bronze: 1,
  silver: 2,
  gold: 3,
  plasma_elite: 4,
};
export const rewardCatalog = [
  {
    id: "donor-certificate",
    title: "Digital donor certificate",
    tier: "bronze",
    description: "A printable certificate for a verified contribution.",
    kind: "certificate",
  },
  {
    id: "community",
    title: "Donor community recognition",
    tier: "silver",
    description:
      "Request an invitation to community events and donor activities.",
    kind: "request",
  },
  {
    id: "story",
    title: "Share your story",
    tier: "gold",
    description:
      "Request recognition in a future Rudhira donor story. Publication requires your separate consent.",
    kind: "request",
  },
  {
    id: "advisory",
    title: "Donor advisory interest",
    tier: "plasma_elite",
    description:
      "Express interest in helping shape the plasma donor community.",
    kind: "request",
  },
  {
    id: "basic-health-panel",
    title: "Annual basic health panel",
    tier: "silver",
    description:
      "Request an annual basic health panel through an approved partner program.",
    kind: "health",
    enabled: false,
  },
  {
    id: "comprehensive-health-panel",
    title: "Annual comprehensive health panel",
    tier: "gold",
    description:
      "Request a comprehensive health panel through an approved partner program.",
    kind: "health",
    enabled: false,
  },
  {
    id: "plasma-health-program",
    title: "Plasma donor health program",
    tier: "plasma_elite",
    description:
      "Request information about an approved plasma donor health program. The provider confirms available services.",
    kind: "health",
    enabled: false,
  },
];
