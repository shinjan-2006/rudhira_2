import { useState, type FormEvent } from "react";
import { api, auth } from "./auth";
import { roleNames, type Role } from "./types";
type Field = {
  name: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  value?: string;
  hint?: string;
};
export function ActionForm({
  title,
  fields,
  button,
  submit,
}: {
  title: string;
  fields: Field[];
  button: string;
  submit: (data: Record<string, string>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    try {
      await submit(
        Object.fromEntries(new FormData(form).entries()) as Record<
          string,
          string
        >,
      );
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="action-form" onSubmit={send}>
      <h3>{title}</h3>
      <div className="form-grid">
        {fields.map((f) => (
          <label
            key={f.name}
            className={f.type === "textarea" ? "field wide" : "field"}
          >
            <span>{f.label}</span>
            {f.options ? (
              <select
                name={f.name}
                required={f.required !== false}
                defaultValue={f.value || ""}
              >
                <option value="" disabled>
                  Select {f.label.toLowerCase()}
                </option>
                {f.options.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                name={f.name}
                required={f.required !== false}
                maxLength={f.max || 2000}
                rows={3}
              />
            ) : (
              <input
                name={f.name}
                type={f.type || "text"}
                required={f.required !== false}
                min={f.min}
                max={f.type === "number" ? f.max : undefined}
                maxLength={f.type !== "number" ? f.max || 180 : undefined}
                defaultValue={f.value}
              />
            )}{" "}
            {f.hint ? <small>{f.hint}</small> : null}
          </label>
        ))}
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="primary" disabled={busy}>
        {busy ? "Saving…" : button}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
export function AuthForm({
  role,
  onSession,
}: {
  role: Role;
  onSession: () => Promise<void>;
}) {
  const [mode, setMode] = useState<
    "signin" | "signup" | "verify" | "forgot" | "reset"
  >("signin");
  const [email, setEmail] = useState(""),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(
      new FormData(e.currentTarget).entries(),
    ) as Record<string, string>;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const address = data.email || email;
      setEmail(address);
      const result =
        mode === "signup"
          ? await auth.signUp.email({
              email: address,
              password: data.password,
              name: data.name,
            })
          : mode === "verify"
            ? await auth.emailOtp.verifyEmail({
                email: address,
                otp: data.code,
              })
            : mode === "forgot"
              ? await auth.emailOtp.sendVerificationOtp({
                  email: address,
                  type: "forget-password",
                })
              : mode === "reset"
                ? await auth.emailOtp.resetPassword({
                    email: address,
                    otp: data.code,
                    password: data.password,
                  })
                : await auth.signIn.email({
                    email: address,
                    password: data.password,
                  });
      if (result.error)
        throw new Error(result.error.message || "Please try again.");
      if (mode === "forgot") {
        setMode("reset");
        setNotice(
          "If this address has an account, a reset code has been sent.",
        );
      } else if (mode === "reset") {
        setMode("signin");
        setNotice("Password updated. You can sign in.");
      } else if (mode === "signup") {
        setMode("verify");
        setNotice("Check your email for a verification code.");
      } else if (mode === "verify") {
        setMode("signin");
        setNotice("Email verified. Sign in to finish your profile.");
        await onSession();
      } else {
        await onSession();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    setBusy(true);
    setError("");
    try {
      const r = await auth.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });
      if (r.error) throw new Error(r.error.message);
      setNotice("A new code has been sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }
  const titles = {
    signin: `${roleNames[role]} sign in`,
    signup: `Join as a ${roleNames[role].toLowerCase()}`,
    verify: "Verify your email",
    forgot: "Reset your password",
    reset: "Enter your reset code",
  };
  return (
    <form className="auth-form" onSubmit={send} key={mode}>
      <span className="eyebrow">YOUR PLACE IN THE NETWORK</span>
      <h2>{titles[mode]}</h2>
      <p>
        {mode === "signin"
          ? "Welcome back. Your next connection starts here."
          : mode === "signup"
            ? "Create your secure account, then complete your network profile."
            : "We’ll help you regain access securely."}
      </p>
      {mode === "signup" ? (
        <label>
          Name
          <input name="name" autoComplete="name" required maxLength={120} />
        </label>
      ) : null}
      {!["verify", "reset"].includes(mode) || !email ? (
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={email}
            required
          />
        </label>
      ) : (
        <p className="address-note">Code sent to {email}</p>
      )}
      {["signin", "signup", "reset"].includes(mode) ? (
        <label>
          {mode === "reset" ? "New password" : "Password"}
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            minLength={mode === "signin" ? 1 : 12}
            maxLength={128}
            required
          />
          {mode !== "signin" ? (
            <small>Use at least 12 characters.</small>
          ) : null}
        </label>
      ) : null}
      {["verify", "reset"].includes(mode) ? (
        <label>
          Verification code
          <input
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </label>
      ) : null}
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="form-notice" role="status">
          {notice}
        </p>
      ) : null}
      <button className="primary" disabled={busy}>
        {busy
          ? "Please wait…"
          : mode === "signin"
            ? "Sign in"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset code"
                : mode === "reset"
                  ? "Reset password"
                  : "Verify email"}
        <span>↗</span>
      </button>
      <div className="auth-links">
        {mode === "signin" ? (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setNotice("");
              }}
            >
              Create an account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError("");
                setNotice("");
              }}
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("verify");
                setError("");
                setNotice("Enter your registered email and verification code.");
              }}
            >
              Verify an existing account
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setNotice("");
            }}
          >
            Back to sign in
          </button>
        )}
        {mode === "verify" ? (
          <button type="button" onClick={resend} disabled={busy || !email}>
            Resend code
          </button>
        ) : null}
      </div>
    </form>
  );
}
export function Onboarding({
  role,
  name,
  onDone,
}: {
  role: Role;
  name: string;
  onDone: () => Promise<void>;
}) {
  const common: Field[] = [
    {
      name: "name",
      label: role === "donor" ? "Your name" : "Contact name",
      value: name,
    },
    { name: "city", label: "City" },
  ];
  const fields: Field[] =
    role === "donor"
      ? [
          ...common,
          { name: "age", label: "Age", type: "number", min: 18, max: 100 },
          {
            name: "bloodGroup",
            label: "Blood group",
            options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
          },
        ]
      : [
          ...common,
          {
            name: "organization",
            label: role === "hospital" ? "Hospital name" : "Organization name",
          },
          {
            name: "licenseNumber",
            label: "Organization licence / registration number",
            max: 100,
            hint: "Your organization will be reviewed before partner tools are available.",
          },
        ];
  return (
    <div className="onboarding">
      <span className="eyebrow">ONE MORE CONNECTION</span>
      <h2>Make yourself at home.</h2>
      <p>
        You’re joining as a {roleNames[role].toLowerCase()}. Your account’s role
        is fixed after registration.
      </p>
      <ActionForm
        title="Your network profile"
        fields={fields}
        button="Join the network"
        submit={async (data) => {
          await api("enroll", {
            role,
            ...data,
            ...(role === "donor" ? { age: Number(data.age) } : {}),
          });
          await onDone();
        }}
      />
    </div>
  );
}
