import { useState, useEffect, useRef } from "react";
import { getCertificate } from "./auth";
import {
  date,
  tierNames,
  tierRank,
  type Dashboard,
  type Reward,
} from "./types";
const tiers = [
  {
    id: "bronze",
    count: "1 verified donation",
    title: "A first connection",
    copy: "Digital certificate and a donor badge.",
  },
  {
    id: "silver",
    count: "2–3 verified donations",
    title: "A growing community",
    copy: "Donor community activities and recognition requests.",
  },
  {
    id: "gold",
    count: "4+ verified donations",
    title: "An enduring contribution",
    copy: "An invitation to share your donor story, with your consent.",
  },
  {
    id: "plasma_elite",
    count: "6+ plasma / apheresis donations",
    title: "Connected by possibility",
    copy: "Interest in donor advisory and plasma community activities.",
  },
];
export function Rewards({
  data,
  catalog,
  onAction,
}: {
  data: Dashboard | null;
  catalog: Reward[];
  onAction: (route: string, body: unknown) => Promise<void>;
}) {
  const [cert, setCert] = useState<Awaited<
      ReturnType<typeof getCertificate>
    > | null>(null),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!cert) return;
    const previous = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCert(null);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>("button,a[href]") || [],
      );
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [cert]);
  const rewards = data?.rewards,
    claims = data?.claims || [];
  async function certificate(id: string) {
    try {
      setCert(await getCertificate(id));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Certificate unavailable.");
    }
  }
  return (
    <section className="rewards-page">
      <span className="eyebrow">RECOGNITION, ROOTED IN CARE</span>
      <h1>
        Every contribution
        <br />
        <em>leaves a connection.</em>
      </h1>
      <p className="lead">
        Bronze. Silver. Gold. Plasma Elite. A living record of the difference
        you make, built from verified donations in the past 12 months.
      </p>
      {rewards ? (
        <div className={`reward-summary tier-${rewards.tier}`}>
          <div>
            <span className="eyebrow">YOUR DONOR TIER</span>
            <h2>{tierNames[rewards.tier]}</h2>
            <p>
              {rewards.count} verified contributions · {rewards.plasma} plasma /
              apheresis
            </p>
          </div>
          <div>
            <strong>{rewards.count}</strong>
            <span>
              {rewards.remaining !== null
                ? `${rewards.remaining} contribution${rewards.remaining === 1 ? "" : "s"} to the next recognition tier`
                : "You’ve reached Gold recognition or above."}
            </span>
          </div>
        </div>
      ) : null}
      <div className="tier-grid">
        {tiers.map((t, i) => (
          <article
            key={t.id}
            className={`tier-card tier-${t.id} ${rewards?.tier === t.id ? "current-tier" : ""}`}
          >
            <div className="tier-top">
              <span className="tier-orb" aria-hidden="true" />
              <span className="eyebrow">0{i + 1}</span>
            </div>
            <h2>{tierNames[t.id]}</h2>
            <p className="tier-threshold">{t.count}</p>
            <h3>{t.title}</h3>
            <p>{t.copy}</p>
            {rewards?.tier === t.id ? (
              <span className="status-tag">Your current tier</span>
            ) : null}
          </article>
        ))}
      </div>
      <aside className="care-note">
        <span aria-hidden="true">✧</span>
        <p>
          Recognition never determines whether or when you can donate. A
          qualified donation service makes those decisions. Rewards are
          non-cash; health panels, priority services and insurance are not
          available until approved partner programs exist.
        </p>
      </aside>
      <div className="section-heading">
        <h2>Your recognition collection</h2>
        <span>One request per reward per calendar year</span>
      </div>
      <div className="reward-grid">
        {catalog.map((reward) => {
          const claim = claims.find(
            (x) =>
              x.reward_id === reward.id &&
              x.year === new Date().getUTCFullYear(),
          );
          const available =
            rewards &&
            reward.enabled &&
            tierRank[rewards.tier] >= tierRank[reward.tier];
          return (
            <article className="reward-card" key={reward.id}>
              <span className="eyebrow">{tierNames[reward.tier]}</span>
              <h3>{reward.title}</h3>
              <p>{reward.details || reward.description}</p>
              {reward.kind === "health" ? (
                <small>
                  {reward.enabled
                    ? `Partner program: ${reward.provider}. The provider confirms the services and eligibility.`
                    : "Partner program awaiting activation."}
                </small>
              ) : null}
              {data?.profile?.role === "donor" ? (
                claim ? (
                  <>
                    <span className="status-tag">{claim.status}</span>
                    {reward.kind === "certificate" &&
                    claim.status === "fulfilled" ? (
                      <button
                        className="text-button"
                        onClick={() => certificate(claim.id)}
                      >
                        View certificate ↗
                      </button>
                    ) : null}
                  </>
                ) : (
                  <button
                    className="secondary"
                    disabled={!available}
                    onClick={() =>
                      onAction("claim", { rewardId: reward.id, consent: true })
                    }
                  >
                    {available
                      ? reward.kind === "certificate"
                        ? "Create certificate"
                        : "Request recognition"
                      : !reward.enabled
                        ? "Partner program not yet active"
                        : "Available at " + tierNames[reward.tier]}
                    <span>↗</span>
                  </button>
                )
              ) : (
                <a className="text-button" href="?role=donor">
                  Join as a donor ↗
                </a>
              )}
            </article>
          );
        })}
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {cert ? (
        <div
          className="certificate-overlay"
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label="Your donor certificate"
        >
          <div className="certificate-shell">
            <div className="certificate-tools">
              <button className="secondary" onClick={() => window.print()}>
                Print / save PDF
              </button>
              <button className="text-button" onClick={() => setCert(null)}>
                Close ×
              </button>
            </div>
            <article className="donor-certificate">
              <span className="certificate-mark" aria-hidden="true">
                ◈
              </span>
              <span className="eyebrow">RUDHIRA · A WORLD OF LIFE</span>
              <h2>
                A connection
                <br />
                worth celebrating.
              </h2>
              <p>With gratitude for the verified contribution of</p>
              <h3>{cert.name}</h3>
              <p>Recorded donation · {date(cert.donatedAt)}</p>
              <span className="certificate-tier">
                {tierNames[cert.tier]} recognition
              </span>
              <footer>
                Issued {date(cert.issuedAt)}
                <br />
                Certificate {cert.id}
                <br />A recognition certificate, not a medical document.
              </footer>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
