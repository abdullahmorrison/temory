"use client";

import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import type { AuthState } from "@/app/(auth)/actions";
import { SectionLabel } from "@/components/section-label";

type Props = {
  action: (prev: AuthState, form: FormData) => Promise<AuthState>;
  /** Create account asks for a name and a new password; Sign in for an existing one. */
  kind: "create" | "sign-in";
  /** The shortest password allowed, from the server (lib/password.ts). */
  minLength: number;
};

const FIELD = "flex h-12.5 items-center gap-2.5 rounded-xl border bg-surface px-4 transition-colors";
const INPUT = "min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted";

/** The Create account and Sign in forms: a few fields, one button, and a link to the other. */
export function AuthForm({ action, kind, minLength }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const create = kind === "create";
  // Sign in's one error is that the email and password don't match, shown on the password.
  const wrongPassword = !create && !!state.error;
  return (
    <form action={formAction} className="flex flex-col gap-5">
      {create && (
        <Field label="Name">
          <input name="name" required autoComplete="name" defaultValue={state.name} className={INPUT} />
        </Field>
      )}
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" defaultValue={state.email} className={INPUT} />
      </Field>
      <div className="flex flex-col gap-2">
        <PasswordField minLength={create ? minLength : undefined} invalid={wrongPassword} />
        {state.error ? (
          <p className="text-xs text-accent" aria-live="polite">
            {state.error}
          </p>
        ) : (
          create && <p className="text-xs text-muted">At least {minLength} characters.</p>
        )}
      </div>
      <button
        disabled={pending}
        className="rounded-full bg-accent px-6 py-3.25 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? (create ? "Creating account…" : "Signing in…") : create ? "Create account" : "Sign in"}
      </button>
      <p className="text-[0.8125rem] text-muted">
        {create ? "Already have one?" : "New here?"}{" "}
        <Link href={create ? "/sign-in" : "/sign-up"} replace className="font-medium text-accent hover:underline">
          {create ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <SectionLabel as="span">{label}</SectionLabel>
      <span className={`${FIELD} border-line focus-within:border-ink focus-within:ring-[0.5px] focus-within:ring-ink`}>{children}</span>
    </label>
  );
}

/** A password box with an eye to show what's typed. */
// A minimum length means a new password, which the browser can offer to make up.
function PasswordField({ minLength, invalid }: { minLength?: number; invalid: boolean }) {
  const [shown, setShown] = useState(false);
  const id = useId(); // Next keeps the other auth page alive, so a fixed id would be on the page twice
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id}>
        <SectionLabel as="span">Password</SectionLabel>
      </label>
      <span
        className={`${FIELD} ${invalid ? "border-accent ring-[0.5px] ring-accent" : "border-line focus-within:border-ink focus-within:ring-[0.5px] focus-within:ring-ink"}`}
      >
        <input
          id={id}
          name="password"
          type={shown ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={minLength ? "new-password" : "current-password"}
          aria-invalid={invalid}
          className={INPUT}
        />
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? "Hide password" : "Show password"} className="text-muted hover:text-ink">
          {shown ? <EyeOff size="1.125rem" /> : <Eye size="1.125rem" />}
        </button>
      </span>
    </div>
  );
}
