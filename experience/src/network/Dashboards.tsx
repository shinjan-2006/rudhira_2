import { useState } from "react";
import { ActionForm } from "./Forms";
import {
  date,
  time,
  tierNames,
  type Dashboard,
  type Booking,
  type PlasmaRequest,
} from "./types";
type Props = {
  data: Dashboard;
  tab: string;
  onAction: (route: string, body: unknown) => Promise<void>;
  onSubmit?: (route: string, body: unknown) => Promise<void>;
};
export function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">✧</span>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}
export function Donor({ data, tab, onAction }: Props) {
  const [city, setCity] = useState("");
  const bookings = data.bookings || [],
    donations = data.donations || [],
    camps = data.camps || [];
  const upcoming = bookings.filter((x) =>
    ["requested", "confirmed"].includes(x.status),
  );
  if (tab === "history")
    return (
      <section>
        <span className="eyebrow">YOUR LIVING RECORD</span>
        <h1>
          A history of <em>giving.</em>
        </h1>
        <p className="lead">
          Only your hospital can verify a donation. Confirmed records keep your
          recognition up to date.
        </p>
        {donations.length ? (
          <div className="record-list">
            {donations.map((d) => (
              <article key={d.id}>
                <span className="record-icon">◈</span>
                <div>
                  <h3>
                    {d.kind === "blood"
                      ? "Blood donation"
                      : d.kind === "plasma"
                        ? "Plasma donation"
                        : "Apheresis donation"}
                  </h3>
                  <p>
                    {d.organization} · {date(d.donated_at)}
                  </p>
                  <small>Reference {d.reference}</small>
                </div>
                <span className="status-tag">{d.status}</span>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Your first chapter is ahead."
            copy="Your verified contributions will appear here after a hospital records them."
          />
        )}
      </section>
    );
  if (tab === "camps")
    return (
      <section>
        <span className="eyebrow">FIND YOUR NEXT CONNECTION</span>
        <h1>
          A place to <em>give.</em>
        </h1>
        <p className="lead">
          Browse camps published by approved hospitals. Request a place; the
          hospital confirms your booking and assesses donation eligibility.
        </p>
        <label className="search-field">
          Filter by city
          <input
            placeholder="Search your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <div className="camp-grid">
          {camps
            .filter((x) => x.city.toLowerCase().includes(city.toLowerCase()))
            .map((c) => {
              const booked = bookings.find(
                (x) =>
                  x.camp_id === c.id &&
                  ["requested", "confirmed", "completed"].includes(x.status),
              );
              return (
                <article className="camp-card" key={c.id}>
                  <span className="eyebrow">
                    {c.kind} · {c.city}
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.organization}</p>
                  <dl>
                    <div>
                      <dt>When</dt>
                      <dd>{time(c.starts_at)}</dd>
                    </div>
                    <div>
                      <dt>Where</dt>
                      <dd>{c.address}</dd>
                    </div>
                  </dl>
                  <button
                    className="secondary"
                    disabled={!!booked}
                    onClick={() => onAction("book", { campId: c.id })}
                  >
                    {booked ? booked.status : "Request a place"}
                    <span>↗</span>
                  </button>
                </article>
              );
            })}
        </div>
        {!camps.length ? (
          <Empty
            title="New connections are on their way."
            copy="Approved hospitals will publish their upcoming donation camps here."
          />
        ) : null}
      </section>
    );
  return (
    <section>
      <span className="eyebrow">YOUR DONOR DASHBOARD</span>
      <h1>
        Hello, {data.profile?.name.split(" ")[0]}.<br />
        <em>You belong here.</em>
      </h1>
      <div className="stats-row">
        <Stat label="Verified this year" value={data.rewards?.count || 0} />
        <Stat
          label="Your recognition"
          value={tierNames[data.rewards?.tier || "welcome"]}
        />
        <Stat label="Upcoming requests" value={upcoming.length} />
        <Stat label="Blood group" value={data.profile?.blood_group || "—"} />
      </div>
      <div className="section-heading">
        <h2>Your upcoming connections</h2>
        <span>Times shown in your timezone</span>
      </div>
      {upcoming.length ? (
        <div className="record-list">
          {upcoming.map((b) => (
            <article key={b.id}>
              <span className="record-icon">◈</span>
              <div>
                <h3>{b.title}</h3>
                <p>
                  {b.organization} · {time(b.starts_at)}
                </p>
                <small>{b.address}</small>
              </div>
              <span className="status-tag">{b.status}</span>
              <button
                className="text-button"
                onClick={() =>
                  onAction("booking", { id: b.id, status: "cancelled" })
                }
              >
                Cancel request
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="Your next connection starts with a camp."
          copy="Open Find a camp to request a place at an approved hospital’s donation camp."
        />
      )}
      <aside className="care-note">
        <span>✧</span>
        <p>
          A booking request is an expression of interest. Your hospital confirms
          availability and provides screening and clinical guidance.
        </p>
      </aside>
    </section>
  );
}
export function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
const kindOptions = ["blood", "plasma", "apheresis"];
export function Hospital({ data, tab, onAction, onSubmit = onAction }: Props) {
  const [record, setRecord] = useState<Booking | null>(null),
    [response, setResponse] = useState<PlasmaRequest | null>(null);
  const camps = data.camps || [],
    bookings = data.bookings || [],
    requests = data.requests || [];
  if (data.profile?.status !== "approved")
    return <PartnerPending data={data} />;
  if (tab === "partners")
    return (
      <section>
        <span className="eyebrow">PLASMA PARTNER NETWORK</span>
        <h1>
          Possibility, <em>connected.</em>
        </h1>
        <p className="lead">
          Respond to approved fractionators’ requirements. These are
          coordination requests; they do not execute a sale, allocate donor
          material or replace quality review.
        </p>
        {response ? (
          <ActionForm
            title={`Respond to ${response.title}`}
            fields={[
              {
                name: "message",
                label: "Your response",
                type: "textarea",
                max: 1000,
              },
            ]}
            button="Send partner response"
            submit={async (b) => {
              await onSubmit("respond", {
                requestId: response.id,
                message: b.message,
              });
              setResponse(null);
            }}
          />
        ) : null}
        <div className="camp-grid">
          {requests.map((r) => {
            const sent = data.responses?.find((x) => x.request_id === r.id);
            return (
              <article className="camp-card" key={r.id}>
                <span className="eyebrow">
                  {r.city} · {r.litres} L requested
                </span>
                <h3>{r.title}</h3>
                <p>
                  {r.organization} · Required by {date(r.required_by)}
                </p>
                <p>{r.requirements}</p>
                {sent ? (
                  <span className="status-tag">Response {sent.status}</span>
                ) : (
                  <button className="secondary" onClick={() => setResponse(r)}>
                    Respond ↗
                  </button>
                )}
              </article>
            );
          })}
        </div>
        {!requests.length ? (
          <Empty
            title="A network ready to grow."
            copy="Open requirements from approved fractionators will appear here."
          />
        ) : null}
      </section>
    );
  if (tab === "bookings")
    return (
      <section>
        <span className="eyebrow">FROM INTEREST TO CONTRIBUTION</span>
        <h1>
          Care for every <em>connection.</em>
        </h1>
        <p className="lead">
          Confirm requests, carry out your clinical checks, then record
          completed donations. Recording a donation updates the donor’s history
          and rewards.
        </p>
        {record ? (
          <div className="verification-card">
            <button className="text-button" onClick={() => setRecord(null)}>
              Close recording form ×
            </button>
            <ActionForm
              title={`Record donation · ${record.donor_name}`}
              fields={[
                {
                  name: "reference",
                  label: "Hospital donation reference",
                  max: 100,
                },
                {
                  name: "donatedAt",
                  label: "Actual donation date and time",
                  type: "datetime-local",
                },
                {
                  name: "screened",
                  label:
                    "I confirm this donation was completed and verified under our clinical process.",
                  type: "checkbox",
                },
              ]}
              button="Verify completed donation"
              submit={async (b) => {
                await onSubmit("verify", {
                  bookingId: record.id,
                  reference: b.reference,
                  donatedAt: new Date(b.donatedAt).toISOString(),
                  screened: b.screened === "on",
                });
                setRecord(null);
              }}
            />
          </div>
        ) : null}
        <div className="record-list">
          {bookings.map((b) => (
            <article key={b.id}>
              <div>
                <h3>{b.donor_name}</h3>
                <p>
                  {b.blood_group} · {b.title} · {time(b.starts_at)}
                </p>
              </div>
              <span className="status-tag">{b.status}</span>
              <div className="record-actions">
                {b.status === "requested" && b.camp_status === "open" ? (
                  <>
                    <button
                      className="secondary"
                      onClick={() =>
                        onAction("booking", { id: b.id, status: "confirmed" })
                      }
                    >
                      Confirm
                    </button>
                    <button
                      className="text-button"
                      onClick={() =>
                        onAction("booking", { id: b.id, status: "declined" })
                      }
                    >
                      Decline
                    </button>
                  </>
                ) : null}
                {b.status === "confirmed" && b.camp_status === "open" ? (
                  <button className="secondary" onClick={() => setRecord(b)}>
                    Record donation ↗
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        {!bookings.length ? (
          <Empty
            title="There are no donor requests yet."
            copy="Publish a camp so donors can request a place."
          />
        ) : null}
      </section>
    );
  return (
    <section>
      <span className="eyebrow">HOSPITAL DASHBOARD</span>
      <h1>
        Care brings
        <br />
        <em>us together.</em>
      </h1>
      <p className="lead">
        {data.profile.organization} · {data.profile.city}
      </p>
      <div className="stats-row">
        <Stat label="Camps published" value={camps.length} />
        <Stat
          label="Awaiting confirmation"
          value={bookings.filter((b) => b.status === "requested").length}
        />
        <Stat
          label="Verified contributions"
          value={bookings.filter((b) => b.status === "completed").length}
        />
      </div>
      <ActionForm
        title="Publish a donation camp"
        fields={[
          { name: "title", label: "Camp name", max: 160 },
          { name: "kind", label: "Donation type", options: kindOptions },
          { name: "city", label: "City", value: data.profile.city },
          { name: "address", label: "Venue address", max: 300 },
          { name: "startsAt", label: "Starts", type: "datetime-local" },
          { name: "endsAt", label: "Ends", type: "datetime-local" },
          {
            name: "capacity",
            label: "Available places",
            type: "number",
            min: 1,
            max: 1000,
          },
        ]}
        button="Publish camp"
        submit={async (b) => {
          await onSubmit("camp", {
            ...b,
            capacity: Number(b.capacity),
            startsAt: new Date(b.startsAt).toISOString(),
            endsAt: new Date(b.endsAt).toISOString(),
          });
        }}
      />
      <div className="section-heading">
        <h2>Your camps</h2>
        <span>{camps.length} published</span>
      </div>
      <div className="camp-grid">
        {camps.map((c) => (
          <article className="camp-card" key={c.id}>
            <span className="eyebrow">
              {c.kind} · {c.city}
            </span>
            <h3>{c.title}</h3>
            <p>
              {time(c.starts_at)} · {c.capacity} places
            </p>
            <span className="status-tag">{c.status}</span>
            {c.status === "open" ? (
              <button
                className="text-button"
                onClick={() => {
                  if (
                    window.confirm("Cancel this camp and its pending bookings?")
                  )
                    void onAction("closeCamp", { id: c.id });
                }}
              >
                Cancel camp
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
export function Fractionator({
  data,
  tab,
  onAction,
  onSubmit = onAction,
}: Props) {
  if (data.profile?.status !== "approved")
    return <PartnerPending data={data} />;
  const requests = data.requests || [],
    responses = data.responses || [];
  if (tab === "responses")
    return (
      <section>
        <span className="eyebrow">PARTNER CONVERSATIONS</span>
        <h1>
          Find the next <em>connection.</em>
        </h1>
        <p className="lead">
          Review hospital responses. Acceptance records an interest in
          continuing the conversation, with quality and supply agreements
          managed separately.
        </p>
        <div className="record-list">
          {responses.map((r) => (
            <article key={r.id}>
              <div>
                <h3>{r.organization}</h3>
                <p>
                  {r.title} · {r.city}
                </p>
                <p>{r.message}</p>
              </div>
              <span className="status-tag">{r.status}</span>
              {r.status === "submitted" &&
              requests.find((x) => x.id === r.request_id)?.status === "open" ? (
                <div className="record-actions">
                  <button
                    className="secondary"
                    onClick={() =>
                      onAction("response", { id: r.id, status: "accepted" })
                    }
                  >
                    Continue conversation
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      onAction("response", { id: r.id, status: "declined" })
                    }
                  >
                    Decline
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
        {!responses.length ? (
          <Empty
            title="Conversations start with a requirement."
            copy="Publish your requirements and approved hospitals can respond."
          />
        ) : null}
      </section>
    );
  return (
    <section>
      <span className="eyebrow">PLASMA FRACTIONATOR DASHBOARD</span>
      <h1>
        A network of
        <br />
        <em>possibilities.</em>
      </h1>
      <p className="lead">
        {data.profile.organization} · {data.profile.city}
      </p>
      <div className="stats-row">
        <Stat
          label="Open requirements"
          value={requests.filter((x) => x.status === "open").length}
        />
        <Stat label="Partner responses" value={responses.length} />
        <Stat
          label="Accepted conversations"
          value={responses.filter((x) => x.status === "accepted").length}
        />
      </div>
      <ActionForm
        title="Publish a plasma requirement"
        fields={[
          { name: "title", label: "Requirement title", max: 160 },
          { name: "city", label: "City", value: data.profile.city },
          {
            name: "litres",
            label: "Volume sought (litres)",
            type: "number",
            min: 1,
            max: 100000,
          },
          { name: "requiredBy", label: "Required by", type: "date" },
          {
            name: "requirements",
            label: "Quality and logistical requirements",
            type: "textarea",
          },
        ]}
        button="Publish requirement"
        submit={async (b) => {
          await onSubmit("plasma", { ...b, litres: Number(b.litres) });
        }}
      />
      <div className="section-heading">
        <h2>Your requirements</h2>
        <span>Coordination requests</span>
      </div>
      <div className="camp-grid">
        {requests.map((r) => (
          <article key={r.id} className="camp-card">
            <span className="eyebrow">
              {r.city} · {r.litres} L requested
            </span>
            <h3>{r.title}</h3>
            <p>Required by {date(r.required_by)}</p>
            <p>{r.requirements}</p>
            <span className="status-tag">{r.status}</span>
            {r.status === "open" ? (
              <button
                className="text-button"
                onClick={() => onAction("closeRequest", { id: r.id })}
              >
                Close requirement
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
function PartnerPending({ data }: { data: Dashboard }) {
  return (
    <section>
      <span className="eyebrow">A TRUSTED NETWORK STARTS HERE</span>
      <h1>
        Your organization,
        <br />
        <em>under review.</em>
      </h1>
      <p className="lead">{data.profile?.organization}</p>
      <div className="pending-card">
        <span className="status-tag">{data.profile?.status}</span>
        <h2>
          {data.profile?.status === "rejected"
            ? "Your application needs attention."
            : "Thank you for joining the network."}
        </h2>
        <p>
          An administrator reviews your organization’s registration before
          partner tools are enabled. Your profile has been saved securely.
        </p>
        {data.profile?.review_note ? (
          <p className="review-message">
            Review note: {data.profile.review_note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
