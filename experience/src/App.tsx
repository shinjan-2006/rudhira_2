import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import gsap from "gsap";
import {
  config,
  getDestination,
  type ActionId,
  type Destination,
  type DestinationId,
} from "./config";
import { prepareWorld, disposeWorld, type WorldGeometry } from "./geometry";
const World = lazy(() => import("./World"));

function useMedia(query: string) {
  const [value, set] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const update = () => set(media.matches);
    media.addEventListener("change", update);
    update();
    return () => media.removeEventListener("change", update);
  }, [query]);
  return value;
}
function supportsWebGL() {
  if (new URLSearchParams(location.search).get("view") === "2d") return false;
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
function currentRoute() {
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return "world";
  }
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span aria-hidden="true" className="arrow-icon">
      {diagonal ? "↗" : "↗"}
    </span>
  );
}
function Brand() {
  return (
    <>
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
        {config.brand}
        <small>A WORLD OF LIFE</small>
      </span>
    </>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function StoryCards() {
  return (
    <div className="story-cards">
      {config.stories.map((story, i) => (
        <article key={story.title}>
          <span className="sample-label">
            ILLUSTRATIVE SAMPLE · {String(i + 1).padStart(2, "0")}
          </span>
          <div className={`story-art art-${i}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <span className="micro">{story.tag}</span>
          <h3>{story.title}</h3>
          <p>{story.body}</p>
        </article>
      ))}
    </div>
  );
}
function DestinationContent({
  destination,
  onAction,
}: {
  destination: Destination;
  onAction: (id: ActionId) => void;
}) {
  return (
    <>
      <p className="eyebrow ink">{destination.eyebrow}</p>
      <h2>{destination.title}</h2>
      <p className="panel-lead">{destination.intro}</p>
      <div className="editorial-body">
        {destination.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
      {destination.id === "stories" ? <StoryCards /> : null}
      {destination.id === "fractionation" ? (
        <div
          className="branch-diagram"
          aria-label="Artistic diagram: plasma connects to separated components and manufacturing partners"
        >
          <span>PLASMA</span>
          <div aria-hidden="true">╱ &nbsp; │ &nbsp; ╲</div>
          <span>COMPONENTS · CONNECTIONS · PARTNERS</span>
        </div>
      ) : null}
      {destination.id === "about" ? (
        <div className="contact-note">
          <span className="micro">SAY HELLO</span>
          {config.contact.email ? (
            <a href={`mailto:${config.contact.email}`}>
              {config.contact.email}
            </a>
          ) : (
            <p>{config.contact.label}</p>
          )}
        </div>
      ) : null}
      <button
        className="button button-ink"
        onClick={() => onAction(destination.action.route)}
      >
        {destination.action.label}
        <Arrow />
      </button>
      <details className="review-note">
        <summary>About this preview</summary>
        <p>{destination.review}</p>
      </details>
    </>
  );
}

function DemoPage({ id }: { id: ActionId }) {
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState("Blood donation");
  useEffect(() => setSubmitted(false), [id]);
  if (id === "plasma-guide")
    return (
      <>
        <p className="eyebrow ink">A FIRST CONVERSATION</p>
        <h2>{"Curiosity is\na good beginning."}</h2>
        <p className="panel-lead">
          A simple starting point for learning about plasma donation.
        </p>
        <div className="guide-steps">
          <article>
            <span>01</span>
            <h3>Meet a qualified service</h3>
            <p>
              A verified donation service can explain its process and discuss
              your individual questions.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Ask what to expect</h3>
            <p>
              Ask about the appointment, the information you will need, and the
              support available.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Make an informed choice</h3>
            <p>
              Take time to understand the information provided. Your decision
              belongs to you.
            </p>
          </article>
        </div>
        <div className="demo-notice">
          <strong>Educational draft · review required</strong>
          <p>{config.actions[id].review}</p>
        </div>
      </>
    );
  return (
    <>
      <p className="eyebrow ink">
        {id === "connect"
          ? "LET’S BEGIN A CONVERSATION"
          : "FIND YOUR FIRST CONNECTION"}
      </p>
      <h2>
        {id === "connect"
          ? "A connected world\nstarts with hello."
          : "Make room\nfor generosity."}
      </h2>
      <p className="panel-lead">
        {id === "connect"
          ? "For community organisers, donation services, and plasma partners."
          : "A future route to verified donation opportunities, with people at the centre."}
      </p>
      <div className="demo-notice">
        <strong>Demo only · no data is sent or saved</strong>
        <p>{config.actions[id].review}</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="demo-form"
      >
        {id === "connect" ? (
          <>
            <label>
              Your name
              <input name="name" autoComplete="name" required maxLength={100} />
            </label>
            <label>
              Email address
              <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              I’m interested in
              <select name="interest">
                <option>Community & donation</option>
                <option>Plasma partnerships</option>
                <option>Sharing a story</option>
                <option>Something else</option>
              </select>
            </label>
            <label>
              Your message
              <textarea name="message" rows={3} required maxLength={1500} />
            </label>
          </>
        ) : (
          <>
            <label>
              What would you like to explore?
              <select value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option>Blood donation</option>
                <option>Plasma donation</option>
              </select>
            </label>
            <label>
              City or region
              <input
                name="region"
                placeholder="Your city"
                required
                maxLength={100}
              />
            </label>
          </>
        )}
        <button type="submit" className="button button-ink">
          {id === "connect" ? "Preview enquiry" : "Preview search"}
          <Arrow />
        </button>
        {submitted ? (
          <div className="form-result" role="status">
            {id === "connect"
              ? "Your demo enquiry is complete. It has not been sent or stored. The team can connect this form to a verified contact service before launch."
              : `The ${topic.toLowerCase()} directory is not connected yet. This demo does not display providers or book appointments.`}
          </div>
        ) : null}
      </form>
    </>
  );
}

function Panel({
  destination,
  action,
  onClose,
  onSelect,
  onAction,
  reduced,
}: {
  destination?: Destination;
  action?: ActionId;
  onClose: () => void;
  onSelect: (id: DestinationId) => void;
  onAction: (id: ActionId) => void;
  reduced: boolean;
}) {
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = panel.current;
    if (!element) return;
    close.current?.focus({ preventScroll: true });
    element.scrollTop = 0;
    const animation = gsap.fromTo(
      element,
      { opacity: 0, y: reduced ? 0 : 24 },
      {
        opacity: 1,
        y: 0,
        duration: reduced ? 0 : 0.65,
        delay: reduced ? 0 : 0.22,
        ease: "power3.out",
      },
    );
    return () => {
      animation.kill();
    };
  }, [destination?.id, action, reduced]);
  useEffect(() => {
    const previous = document.activeElement;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          panel.current?.querySelectorAll<HTMLElement>(
            "a[href],button:not([disabled]),input,textarea,select,summary",
          ) ?? [],
        ).filter((el) => el.getClientRects().length);
        const first = elements[0];
        const last = elements.at(-1);
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !panel.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <section
      className="content-panel"
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={destination?.label ?? config.actions[action!].title}
    >
      <div className="panel-top">
        <span className="micro">
          {destination
            ? `${destination.number} / ${destination.label}`
            : "RUDHIRA / NEXT STEPS"}
        </span>
        <button
          className="close-button"
          ref={close}
          onClick={onClose}
          aria-label="Close destination"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      {destination ? (
        <DestinationContent destination={destination} onAction={onAction} />
      ) : (
        <DemoPage id={action!} />
      )}
      <nav className="panel-next" aria-label="Other destinations">
        <span className="micro">CONTINUE EXPLORING</span>
        {config.destinations
          .filter((d) => d.id !== destination?.id)
          .map((d) => (
            <button key={d.id} onClick={() => onSelect(d.id)}>
              {d.label}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
      </nav>
    </section>
  );
}

function ListView({
  onSelect,
  onAction,
}: {
  onSelect: (id: DestinationId) => void;
  onAction: (id: ActionId) => void;
}) {
  return (
    <main className="list-view" id="main-content" tabIndex={-1}>
      <div className="list-intro">
        <p className="eyebrow ink">A WORLD OF LIFE / THE GUIDE</p>
        <h1>
          One connected world.
          <br />
          <em>Many ways to give life.</em>
        </h1>
        <p>{config.supporting}</p>
      </div>
      <div className="list-grid">
        {config.destinations.map((d) => (
          <article key={d.id} className={`list-card card-${d.id}`}>
            <div className="list-art" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div>
              <span className="micro">
                {d.number} / {d.eyebrow}
              </span>
              <h2>{d.label}</h2>
              <p>{d.intro}</p>
              <details className="list-details">
                <summary>Read the complete guide</summary>
                {d.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
                {d.id === "stories" ? <StoryCards /> : null}
                {d.id === "about" ? (
                  <p>{config.contact.email || config.contact.label}</p>
                ) : null}
                <p className="list-review">Draft for review: {d.review}</p>
              </details>
              <button onClick={() => onSelect(d.id)} className="text-button">
                Explore {d.label}
                <Arrow />
              </button>
              <button
                className="text-button secondary-action"
                onClick={() => onAction(d.action.route)}
              >
                {d.action.label}
                <Arrow />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="list-foot">
        <p>
          The 3D world is an artistic educational interpretation, rather than an
          anatomically exact simulation.
        </p>
        <p>
          Mission and service content are drafts for review. Stories are labeled
          fictional samples. Donation and enquiry pages are unconnected demos.
        </p>
        <a href="./accessible.html">Read the plain HTML guide ↗</a>
      </div>
    </main>
  );
}

export default function App() {
  const mobile = useMedia("(max-width: 760px)");
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  const [supported, setSupported] = useState(supportsWebGL);
  const [geometry, setGeometry] = useState<WorldGeometry | null>(null);
  const [progress, setProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState("Preparing your world");
  const [route, setRoute] = useState(currentRoute);
  const [entered, setEntered] = useState(
    () =>
      !!getDestination(currentRoute()) ||
      ["list", "world"].includes(currentRoute()) ||
      Object.keys(config.actions).includes(currentRoute()),
  );
  const [list, setList] = useState(
    () => !supported || currentRoute() === "list",
  );
  const listRef = useRef(list);
  const [paused, setPaused] = useState(false);
  const [sound, setSound] = useState(false);
  const [soundError, setSoundError] = useState("");
  const [hovered, setHovered] = useState<DestinationId | null>(null);
  const [visible, setVisible] = useState(!document.hidden);
  const readyRef = useRef(false);
  const audio = useRef<{ context: AudioContext; gain: GainNode } | null>(null);
  const destination = getDestination(route);
  const action = Object.keys(config.actions).includes(route)
    ? (route as ActionId)
    : undefined;
  const modal = !!destination || !!action;
  const shell = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const labelRoot = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    let live = true;
    let asset: WorldGeometry | undefined;
    if (supported) {
      prepareWorld((p, label) => {
        if (live) {
          setProgress(p);
          setLoadingLabel(label);
        }
      })
        .then((g) => {
          asset = g;
          if (live) setGeometry(g);
          else disposeWorld(g);
        })
        .catch(() => {
          if (live) setSupported(false);
        });
    } else {
      setEntered(true);
      setList(true);
      setProgress(100);
    }
    return () => {
      live = false;
      if (asset) disposeWorld(asset);
    };
  }, [supported]);
  useEffect(() => {
    listRef.current = list;
  }, [list]);
  useEffect(() => {
    const restore = () => {
      const next = currentRoute();
      setRoute(next);
      if (next === "list") {
        setList(true);
        setEntered(true);
      } else if (next === "world") {
        setList(!supported);
        setEntered(true);
      } else if (
        getDestination(next) ||
        Object.keys(config.actions).includes(next)
      )
        setEntered(true);
    };
    addEventListener("popstate", restore);
    addEventListener("hashchange", restore);
    return () => {
      removeEventListener("popstate", restore);
      removeEventListener("hashchange", restore);
    };
  }, [supported]);
  useEffect(() => {
    const handle = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, []);
  useEffect(() => {
    if (!audio.current) return;
    const a = audio.current;
    a.gain.gain.setTargetAtTime(
      sound && visible ? 0.014 : 0,
      a.context.currentTime,
      0.25,
    );
  }, [sound, visible]);
  useEffect(
    () => () => {
      void audio.current?.context.close();
    },
    [],
  );
  useLayoutEffect(() => {
    if (!shell.current || !entered || reduced) return;
    const copy = shell.current.querySelector(".hero-copy");
    if (!copy) return;
    const animation = gsap.fromTo(
      copy,
      { opacity: 0 },
      { opacity: 1, duration: 0.85, ease: "power3.out" },
    );
    return () => {
      animation.kill();
    };
  }, [entered, reduced]);
  const navigate = useCallback((next: string) => {
    if (location.hash !== `#${next}`) history.pushState(null, "", `#${next}`);
    setRoute(next);
  }, []);
  const onSelect = useCallback(
    (id: DestinationId) => {
      if (!lastFocus.current)
        lastFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      setEntered(true);
      setHovered(null);
      navigate(id);
    },
    [navigate],
  );
  const onAction = useCallback(
    (id: ActionId) => {
      const url = config.actions[id].url;
      if (url) {
        location.assign(url);
        return;
      }
      if (!lastFocus.current)
        lastFocus.current =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
      setEntered(true);
      navigate(id);
    },
    [navigate],
  );
  const onClose = useCallback(() => {
    navigate(listRef.current ? "list" : "world");
    requestAnimationFrame(() => {
      lastFocus.current?.focus({ preventScroll: true });
      lastFocus.current = null;
    });
  }, [navigate]);
  const onReady = useCallback(() => {
    if (!readyRef.current) {
      readyRef.current = true;
      setProgress(100);
      setLoadingLabel("Your world is ready");
    }
  }, []);
  const fail = useCallback(() => {
    setSupported(false);
    setList(true);
    setEntered(true);
    setProgress(100);
  }, []);
  const toggleList = () => {
    const next = supported ? !list : true;
    setList(next);
    setEntered(true);
    navigate(next ? "list" : "world");
  };
  const toggleSound = async () => {
    try {
      if (!audio.current) {
        const context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = 0;
        gain.connect(context.destination);
        [110, 164.81, 220].forEach((hz, i) => {
          const oscillator = context.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = hz;
          const voice = context.createGain();
          voice.gain.value = i === 0 ? 0.55 : 0.2;
          oscillator.connect(voice);
          voice.connect(gain);
          oscillator.start();
        });
        audio.current = { context, gain };
      }
      await audio.current.context.resume();
      setSound((s) => !s);
      setSoundError("");
    } catch {
      setSoundError("Sound is unavailable in this browser.");
    }
  };
  const enter = () => {
    setEntered(true);
    navigate("world");
  };
  const style = {
    "--burgundy": config.colors.burgundy,
    "--crimson": config.colors.crimson,
    "--ivory": config.colors.ivory,
    "--gold": config.colors.gold,
  } as CSSProperties;
  return (
    <div
      ref={shell}
      style={style}
      className={`app ${list ? "list-mode" : ""} ${modal ? "destination-open" : ""} ${entered ? "entered" : "introducing"}`}
    >
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          setList(true);
          setEntered(true);
          navigate("list");
          requestAnimationFrame(() =>
            document.getElementById("main-content")?.focus(),
          );
        }}
      >
        Skip to accessible content
      </a>
      {!list && supported ? (
        <div
          className="world-stage"
          aria-label="Interactive microscopic world"
          inert={modal}
        >
          <div className="world-label-layer" ref={labelRoot} />
          <SceneBoundary onFailure={fail}>
            <Suspense fallback={null}>
              {geometry ? (
                <World
                  labelRoot={labelRoot}
                  geometry={geometry}
                  selected={destination?.id ?? null}
                  entered={entered}
                  mobile={mobile}
                  reduced={reduced}
                  paused={paused || !visible}
                  onSelect={onSelect}
                  onReady={onReady}
                  onHover={setHovered}
                />
              ) : null}
            </Suspense>
          </SceneBoundary>
        </div>
      ) : null}
      <div className="atmosphere" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <header className="site-header" inert={modal || !entered}>
        <button
          className="brand"
          aria-label="Rudhira home"
          onClick={() => {
            setList(!supported);
            navigate(supported ? "world" : "list");
          }}
        >
          <Brand />
        </button>
        <nav aria-label="Main navigation">
          <button
            onClick={() => {
              setList(!supported);
              navigate(supported ? "world" : "list");
            }}
          >
            Explore
          </button>
          <button onClick={() => onSelect("blood")}>Donate</button>
          <button onClick={() => onSelect("fractionation")}>
            Plasma Partners
          </button>
          <button onClick={() => onSelect("about")}>Our Story</button>
          <button onClick={() => location.assign("./network.html?view=rewards")}>Rewards</button>
          <button onClick={() => location.assign("./network.html")}>Sign in</button>
        </nav>
        <button
          className="header-action"
          onClick={() => onAction("opportunities")}
        >
          Explore donation
          <Arrow />
        </button>
      </header>
      {!list && !modal ? (
        <main className="home-main" id="main-content" tabIndex={-1}>
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" /> A WORLD OF LIFE
            </p>
            <h1>
              {config.headline[0]}
              <br />
              <em>{config.headline[1]}</em>
            </h1>
            <p className="hero-support">{config.supporting}</p>
            {entered ? (
              <button
                className="button button-light"
                onClick={() => onAction("opportunities")}
              >
                Explore donation
                <Arrow />
              </button>
            ) : (
              <div className="entry-controls">
                <div className="progress-info">
                  <span aria-live="polite">{loadingLabel}</span>
                  <span>{progress}%</span>
                </div>
                <progress
                  max={100}
                  value={progress}
                  aria-label="World preparation progress"
                />
                <button
                  className="button button-light"
                  disabled={progress < 100}
                  onClick={enter}
                >
                  Enter Rudhira
                  <Arrow />
                </button>
                <button
                  className="entry-list text-button"
                  onClick={() => {
                    setList(true);
                    setEntered(true);
                    navigate("list");
                  }}
                >
                  View as list <span aria-hidden="true">↗</span>
                </button>
              </div>
            )}
          </div>
          <div className="world-caption">
            <span className="caption-line" />
            <span>LIFE, INTERCONNECTED</span>
            <small>AN ARTISTIC MICROSCOPIC WORLD</small>
          </div>
          {entered ? (
            <div className="exploration-hint">
              <span aria-hidden="true">⟷</span>
              <p>
                {reduced
                  ? "Choose a destination to explore."
                  : "Drag gently to explore. Select a connection."}
              </p>
              {hovered ? (
                <span className="hover-copy" aria-live="polite">
                  {getDestination(hovered)?.description}
                </span>
              ) : null}
            </div>
          ) : null}
        </main>
      ) : null}
      {list ? (
        <div inert={modal}>
          <ListView onSelect={onSelect} onAction={onAction} />
        </div>
      ) : null}
      {modal ? (
        <>
          <div className="panel-scrim" aria-hidden="true" />
          {!list && destination ? (
            <div className="selected-connection" aria-hidden="true">
              <span>{destination.number}</span>
              <i />
            </div>
          ) : null}
          <Panel
            destination={destination}
            action={action}
            onClose={onClose}
            onSelect={onSelect}
            onAction={onAction}
            reduced={reduced}
          />
        </>
      ) : null}
      <footer className="world-footer" inert={modal}>
        <span className="footer-thought">{config.closing}</span>
        <div className="experience-controls">
          <button onClick={toggleList}>
            {list && supported ? "View in 3D" : "View as list"}{" "}
            <span aria-hidden="true">⊞</span>
          </button>
          {!list ? (
            <button
              onClick={() => setPaused((p) => !p)}
              aria-pressed={paused || reduced}
              disabled={reduced}
            >
              {reduced
                ? "Reduced motion"
                : paused
                  ? "Resume motion"
                  : "Pause motion"}{" "}
              <span aria-hidden="true">{paused || reduced ? "▷" : "Ⅱ"}</span>
            </button>
          ) : null}
          <button
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? "Turn sound off" : "Turn sound on"}
          >
            Sound {sound ? "on" : "off"}
            <span aria-hidden="true">{sound ? "◖))" : "◖×"}</span>
          </button>
        </div>
      </footer>
      {soundError ? (
        <p className="sound-error" role="status">
          {soundError}
        </p>
      ) : null}
      {!supported ? (
        <div className="fallback-note" role="status">
          You’re viewing the accessible edition. All five destinations are
          available here.
        </div>
      ) : null}
    </div>
  );
}
