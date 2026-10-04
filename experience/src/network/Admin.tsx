import { useCallback, useEffect, useState } from "react";
import { api } from "./auth";
import { ActionForm } from "./Forms";
import {
  date,
  roleNames,
  type Profile,
  type Claim,
  type Donation,
  type Reward,
} from "./types";
import { Empty } from "./Dashboards";
interface AdminData {
  programs: Reward[];
  partners: Profile[];
  claims: Claim[];
  donations: Donation[];
  audits: {
    id: string;
    actor_id: string;
    action: string;
    resource_id: string;
    created_at: string;
  }[];
}
export function Admin({
  onAction,
  revision,
  onSubmit,
}: {
  onAction: (route: string, body: unknown) => Promise<void>;
  revision: number;
  onSubmit: (route: string, body: unknown) => Promise<void>;
}) {
  const [data, setData] = useState<AdminData | null>(null),
    [error, setError] = useState(""),
    [review, setReview] = useState<Profile | null>(null),
    [voidId, setVoidId] = useState("");
  const load = useCallback(async () => {
    try {
      setData(await api<AdminData>("admin"));
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load administration.",
      );
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load, revision]);
  return (
    <section>
      <span className="eyebrow">NETWORK ADMINISTRATION</span>
      <h1>
        Trust, <em>maintained.</em>
      </h1>
      <p className="lead">
        Review partner registrations, manage recognition requests and inspect
        the audit trail.
      </p>
      <ActionForm
        title="Activate an approved health benefit program"
        fields={[
          {
            name: "rewardId",
            label: "Program",
            options: [
              "basic-health-panel",
              "comprehensive-health-panel",
              "plasma-health-program",
            ],
          },
          {
            name: "enabled",
            label: "Availability",
            options: ["active", "inactive"],
          },
          { name: "provider", label: "Approved provider name", max: 180 },
          {
            name: "details",
            label: "Agreed services and booking instructions",
            type: "textarea",
            max: 1500,
          },
        ]}
        button="Save partner program"
        submit={async (b) => {
          await onSubmit("program", {
            rewardId: b.rewardId,
            enabled: b.enabled === "active",
            provider: b.provider,
            details: b.details,
          });
        }}
      />
      <div className="record-list">
        {data?.programs
          .filter((x) => x.kind === "health")
          .map((p) => (
            <article key={p.id}>
              <div>
                <h3>{p.title}</h3>
                <p>{p.provider || "No provider configured"}</p>
              </div>
              <span className="status-tag">
                {p.enabled ? "active" : "inactive"}
              </span>
            </article>
          ))}
      </div>
      {error ? (
        <p role="alert" className="form-error">
          {error}
        </p>
      ) : null}
      {review ? (
        <ActionForm
          title={`Review ${review.organization}`}
          fields={[
            {
              name: "status",
              label: "Decision",
              options: ["approved", "rejected", "suspended"],
            },
            { name: "note", label: "Review note", type: "textarea", max: 1000 },
          ]}
          button="Save review decision"
          submit={async (b) => {
            await onSubmit("review", { id: review.id, ...b });
            setReview(null);
          }}
        />
      ) : null}
      <div className="section-heading">
        <h2>Partner applications</h2>
        <span>
          {data?.partners.filter((x) => x.status === "pending").length || 0}{" "}
          pending
        </span>
      </div>
      <div className="record-list">
        {data?.partners.map((p) => (
          <article key={p.id}>
            <div>
              <h3>{p.organization}</h3>
              <p>
                {roleNames[p.role]} · {p.city} · {p.email}
              </p>
              <small>Registration: {p.license_number}</small>
            </div>
            <span className="status-tag">{p.status}</span>
            <button className="secondary" onClick={() => setReview(p)}>
              Review ↗
            </button>
          </article>
        ))}
      </div>
      {data && !data.partners.length ? (
        <Empty
          title="No partner applications yet."
          copy="Hospitals and fractionators will appear here when they complete registration."
        />
      ) : null}
      <div className="section-heading">
        <h2>Recognition requests</h2>
      </div>
      <div className="record-list">
        {data?.claims.map((c) => (
          <article key={c.id}>
            <div>
              <h3>{c.name}</h3>
              <p>
                {c.reward_id} · {date(c.created_at)}
              </p>
            </div>
            <span className="status-tag">{c.status}</span>
            {c.status === "requested" ? (
              <div className="record-actions">
                <button
                  className="secondary"
                  onClick={() =>
                    onAction("fulfill", { id: c.id, status: "fulfilled" })
                  }
                >
                  Fulfilled
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    onAction("fulfill", { id: c.id, status: "declined" })
                  }
                >
                  Decline
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <div className="section-heading">
        <h2>Verified donations</h2>
      </div>
      {voidId ? (
        <ActionForm
          title="Void an incorrect donation record"
          fields={[
            { name: "reason", label: "Reason", type: "textarea", max: 500 },
          ]}
          button="Void donation"
          submit={async (b) => {
            await onSubmit("void", { id: voidId, reason: b.reason });
            setVoidId("");
          }}
        />
      ) : null}
      <div className="record-list">
        {data?.donations.map((d) => (
          <article key={d.id}>
            <div>
              <h3>
                {d.donor_name} · {d.kind}
              </h3>
              <p>
                {d.organization} · {date(d.donated_at)} · {d.reference}
              </p>
            </div>
            <span className="status-tag">{d.status}</span>
            {d.status === "verified" ? (
              <button className="text-button" onClick={() => setVoidId(d.id)}>
                Void incorrect record
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <div className="section-heading">
        <h2>Audit trail</h2>
        <span>Latest 100 actions</span>
      </div>
      <div className="audit-list">
        {data?.audits.map((a) => (
          <div key={a.id}>
            <strong>{a.action}</strong>
            <span>{date(a.created_at)}</span>
            <small>
              Actor {a.actor_id} · Record {a.resource_id}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
