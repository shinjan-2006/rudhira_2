import { useCallback, useEffect, useState } from "react";
import { api, auth } from "./auth";
import { AuthForm, Onboarding } from "./Forms";
import { Donor, Hospital, Fractionator, Empty } from "./Dashboards";
import { Rewards } from "./Rewards";
import { Admin } from "./Admin";
import {
  roleNames,
  type Role,
  type Dashboard,
  type Reward,
  type Camp,
} from "./types";
const roles: Role[] = ["donor", "hospital", "fractionator"];
function initialRole(): Role {
  const r = new URLSearchParams(location.search).get("role");
  return roles.includes(r as Role) ? (r as Role) : "donor";
}
const roleCopy: Record<Role, { title: string; copy: string; number: string }> =
  {
    donor: {
      title: "A little of you.\nA world of possibility.",
      copy: "Find donation camps, keep a living record of your contributions, and celebrate every verified connection.",
      number: "01",
    },
    hospital: {
      title: "Where generosity\nmeets care.",
      copy: "Bring donors and care together. Publish camps, manage bookings and verify completed contributions.",
      number: "02",
    },
    fractionator: {
      title: "The next chapter\nof connection.",
      copy: "Join approved partners, share plasma requirements and start conversations with hospitals.",
      number: "03",
    },
  };
const navs: Record<Role, { id: string; label: string }[]> = {
  donor: [
    { id: "overview", label: "My dashboard" },
    { id: "camps", label: "Find a camp" },
    { id: "history", label: "Donation history" },
    { id: "rewards", label: "My rewards" },
  ],
  hospital: [
    { id: "overview", label: "Camps & overview" },
    { id: "bookings", label: "Donor bookings" },
    { id: "partners", label: "Plasma network" },
  ],
  fractionator: [
    { id: "overview", label: "Requirements" },
    { id: "responses", label: "Partner responses" },
  ],
};
export default function Network() {
  const [role, setRole] = useState<Role>(initialRole),
    [tab, setTab] = useState(
      () => new URLSearchParams(location.search).get("view") || "overview",
    );
  const [data, setData] = useState<Dashboard | null>(null),
    [user, setUser] = useState<{
      name: string;
      email: string;
      emailVerified: boolean;
    } | null>(null),
    [catalog, setCatalog] = useState<Reward[]>([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [revision, setRevision] = useState(0);
  const refresh = useCallback(async () => {
    const result = await auth.getSession();
    if (result.error)
      throw new Error(result.error.message || "Could not check your session.");
    if (!result.data?.user) {
      setUser(null);
      setData(null);
      return;
    }
    setUser(result.data.user);
    if (!result.data.user.emailVerified) {
      setData(null);
      return;
    }
    const dashboard = await api<Dashboard>("dashboard");
    setData(dashboard);
    if (dashboard.profile) {
      setRole(dashboard.profile.role);
      setTab((old) =>
        old === "rewards" && dashboard.profile?.role !== "donor"
          ? "overview"
          : old,
      );
    }
  }, []);
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const publicInfo = await api<{
          camps: Camp[];
          rewardCatalog: Reward[];
        }>("public");
        if (alive) setCatalog(publicInfo.rewardCatalog);
        await refresh();
      } catch (e) {
        if (alive)
          setError(
            e instanceof Error ? e.message : "Could not open the network.",
          );
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [refresh]);
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("main h1,main h2");
    heading?.focus({ preventScroll: true });
  }, [tab]);
  function chooseRole(value: Role) {
    setRole(value);
    setError("");
    setNotice("");
    const url = new URL(location.href);
    url.searchParams.set("role", value);
    history.replaceState(null, "", url);
  }
  async function action(route: string, body: unknown) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(route, body);
      await refresh();
      setRevision((x) => x + 1);
      setNotice(
        route === "verify"
          ? "Donation verified. The donor’s history and recognition have been updated."
          : route === "claim"
            ? "Your recognition request has been saved."
            : "Saved. Your network is up to date.",
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not save. Please try again.";
      setError(message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const run = (route: string, body: unknown) =>
    action(route, body).catch(() => {});
  async function logout() {
    setBusy(true);
    try {
      const r = await auth.signOut();
      if (r.error) throw new Error(r.error.message);
      setUser(null);
      setData(null);
      setTab("overview");
      setNotice("You’ve signed out securely.");
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out.");
    } finally {
      setBusy(false);
    }
  }
  const signedIn = !!data?.profile,
    viewRewards = tab === "rewards";
  return (
    <div className="network-app">
      <a className="skip-link" href="#network-main">
        Skip to content
      </a>
      <header className="network-header">
        <a
          className="network-brand"
          href="./index.html"
          aria-label="Rudhira home"
        >
          <svg viewBox="0 0 32 40" aria-hidden="true">
            <path
              d="M16 2C11 10 3 19 3 26a13 13 0 0 0 26 0c0-7-8-16-13-24Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M16 13c-3 5-7 10-7 14a7 7 0 0 0 14 0c0-4-4-9-7-14Z"
              fill="currentColor"
            />
          </svg>
          <span>
            RUDHIRA<small>A WORLD OF LIFE</small>
          </span>
        </a>
        <div className="header-links">
          <a href="./index.html#world">Explore the world ↗</a>
          <button onClick={() => setTab(viewRewards ? "overview" : "rewards")}>
            {viewRewards ? "The network" : "Rewards"}
          </button>
          {user ? (
            <button disabled={busy} onClick={logout}>
              Sign out
            </button>
          ) : (
            <button onClick={() => setTab("overview")}>Sign in ↗</button>
          )}
        </div>
      </header>
      {signedIn || data?.isAdmin ? (
        <nav className="dashboard-nav" aria-label="Dashboard">
          {navs[role].map((n) => (
            <button
              key={n.id}
              aria-current={tab === n.id ? "page" : undefined}
              onClick={() => setTab(n.id)}
            >
              {n.label}
            </button>
          ))}
          {data?.isAdmin ? (
            <button
              aria-current={tab === "admin" ? "page" : undefined}
              onClick={() => setTab("admin")}
            >
              Administration
            </button>
          ) : null}
          <span>
            {roleNames[role]} · {data?.profile?.city || "Network owner"}
          </span>
        </nav>
      ) : null}
      <main
        id="network-main"
        tabIndex={-1}
        className={
          signedIn || viewRewards || tab === "admin"
            ? "dashboard-main"
            : "join-main"
        }
      >
        {notice ? (
          <div className="global-notice" role="status">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="global-error" role="alert">
            {error}
            <button
              onClick={() => {
                setLoading(true);
                refresh()
                  .then(() => setError(""))
                  .catch((e) => setError(e.message))
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </button>
          </div>
        ) : null}
        {loading ? (
          <div className="network-loading" role="status">
            <span className="loading-ring" />
            <p>Connecting your world…</p>
          </div>
        ) : tab === "admin" && data?.isAdmin ? (
          <Admin onAction={run} onSubmit={action} revision={revision} />
        ) : viewRewards ? (
          <Rewards data={data} catalog={catalog} onAction={run} />
        ) : signedIn ? (
          <div className="dashboard-content" aria-busy={busy}>
            {role === "donor" ? (
              <Donor data={data} tab={tab} onAction={run} />
            ) : role === "hospital" ? (
              <Hospital
                data={data}
                tab={tab}
                onAction={run}
                onSubmit={action}
              />
            ) : (
              <Fractionator
                data={data}
                tab={tab}
                onAction={run}
                onSubmit={action}
              />
            )}
          </div>
        ) : (
          <div className="join-grid">
            <section className="join-story">
              <span className="eyebrow">
                {roleCopy[role].number} · THE RUDHIRA NETWORK
              </span>
              <h1>
                {roleCopy[role].title
                  .split("\n")
                  .map((x, i) =>
                    i ? <em key={x}>{x}</em> : <span key={x}>{x}</span>,
                  )}
              </h1>
              <p>{roleCopy[role].copy}</p>
              <div className={`connection-art art-${role}`} aria-hidden="true">
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <span className="orbit orbit-three" />
                <span className="life-cell cell-a" />
                <span className="life-cell cell-b" />
                <span className="life-cell cell-c" />
                <span className="gold-cell" />
                <span className="connection-label">LIFE. INTERCONNECTED.</span>
              </div>
              <div className="story-footer">
                <span>One connected world.</span>
                <span>Many ways to give life.</span>
              </div>
            </section>
            <section className="join-card">
              <div
                className="role-selector"
                role="tablist"
                aria-label="Choose account type"
                onKeyDown={(event) => {
                  const direction =
                    event.key === "ArrowRight"
                      ? 1
                      : event.key === "ArrowLeft"
                        ? -1
                        : 0;
                  if (direction) {
                    event.preventDefault();
                    const next =
                      roles[
                        (roles.indexOf(role) + direction + roles.length) %
                          roles.length
                      ];
                    chooseRole(next);
                    document.getElementById(`role-${next}`)?.focus();
                  }
                }}
              >
                {roles.map((r) => (
                  <button
                    key={r}
                    role="tab"
                    aria-selected={r === role}
                    tabIndex={r === role ? 0 : -1}
                    aria-controls="account-form"
                    id={`role-${r}`}
                    onClick={() => chooseRole(r)}
                  >
                    {roleNames[r]}
                  </button>
                ))}
              </div>
              <div
                id="account-form"
                role="tabpanel"
                aria-labelledby={`role-${role}`}
              >
                <>
                  {user?.emailVerified && data ? (
                    <Onboarding role={role} name={user.name} onDone={refresh} />
                  ) : (
                    <AuthForm key={role} role={role} onSession={refresh} />
                  )}
                </>
              </div>
              <p className="privacy-note">
                Your account belongs to one role. Hospital and fractionator
                access requires an organization review.
              </p>
            </section>
          </div>
        )}
        {!signedIn && !viewRewards && !loading ? (
          <section className="network-bottom">
            <span className="eyebrow">THREE SIDES. ONE SHARED PURPOSE.</span>
            <h2>
              A network built
              <br />
              <em>around connection.</em>
            </h2>
            <div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    chooseRole(r);
                    document.getElementById("account-form")?.scrollIntoView({
                      behavior: matchMedia("(prefers-reduced-motion: reduce)")
                        .matches
                        ? "instant"
                        : "smooth",
                    });
                  }}
                >
                  <span>{roleCopy[r].number}</span>
                  <h3>{roleNames[r]}</h3>
                  <p>{roleCopy[r].copy}</p>
                  <span>Join the network ↗</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <footer className="network-footer">
        <span>RUDHIRA · One connected world.</span>
        <span>
          Secure accounts. Verified contributions. Shared possibility.
        </span>
        <a href="./index.html">Return to the world ↗</a>
      </footer>
      {busy ? (
        <div className="saving-indicator" role="status">
          Saving your connection…
        </div>
      ) : null}
    </div>
  );
}
