"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { bringPersonBack, endRelationshipWith } from "@/app/(app)/people/actions";
import { close } from "@/components/nav-stack";
import { SectionLabel } from "@/components/section-label";
import { localToday } from "@/lib/dates";
import { firstName } from "@/lib/names";
import { TIERS } from "@/lib/tiers";

type Person = { id: number; name: string; closeness: number };

/** On the Edit page: ends the relationship today, by your clock, and goes back to their profile. */
export function EndRelationship({ person, moments }: { person: Person; moments: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const name = firstName(person.name);
  const end = () =>
    startTransition(async () => {
      const result = await endRelationshipWith(person.id, localToday());
      if (result.done) close(router, result.done, { refresh: true });
      else setError(result.error ?? "");
    });
  return (
    <section className="flex flex-col items-start gap-2.5">
      <SectionLabel>End the relationship</SectionLabel>
      <p className="text-[0.8125rem] text-muted">
        {name} moves to Past. {moments > 0 && "Your moments together stay, and "}
        {moments > 0 ? "you" : "You"} can bring {name} back any time.
      </p>
      <button
        type="button"
        onClick={end}
        disabled={pending}
        className="rounded-full border border-line px-4 py-2 text-[0.8125rem] font-medium transition-colors hover:border-muted hover:bg-surface disabled:opacity-60"
      >
        {pending ? "Ending…" : "End relationship"}
      </button>
      {error && (
        <p className="text-sm text-accent" aria-live="polite">
          {error}
        </p>
      )}
    </section>
  );
}

/** On a past profile: asks which tier they're in now (where they were, to start), then puts them back. */
export function BringBack({ person, moments }: { person: Person; moments: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tier, setTier] = useState(person.closeness);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const name = firstName(person.name);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const bringBack = () =>
    startTransition(async () => {
      const result = await bringPersonBack(person.id, tier);
      if (result.error) return setError(result.error);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTier(person.closeness);
          setError("");
          setOpen(true);
        }}
        className="mt-3 rounded-full border border-line px-4 py-1.5 text-[0.8125rem] transition-colors hover:border-muted hover:bg-surface"
      >
        Bring back
      </button>
      {open && (
        // A sheet from the bottom on phones; on desktop, the bottom of the panel it's in.
        <div className="fixed inset-0 z-30 desk:left-auto desk:w-110">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bring-back-title"
            className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-3xl bg-paper px-7 pt-3 pb-[calc(max(env(safe-area-inset-bottom),16px)+16px)] text-left shadow-(--shadow-pop)"
          >
            <div className="mx-auto h-1 w-9 rounded-full bg-line" />
            <div className="flex items-center justify-between">
              <h2 id="bring-back-title" className="text-[1.375rem] font-medium">
                Bring {name} back
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink">
                <X size="1.25rem" />
              </button>
            </div>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-[0.9375rem] text-muted">Where is {name} in your life now?</legend>
              <div className="flex flex-wrap gap-2">
                {TIERS.map((t) => (
                  <label key={t.value} className="cursor-pointer">
                    <input type="radio" name="tier" value={t.value} checked={tier === t.value} onChange={() => setTier(t.value)} className="peer sr-only" />
                    <span className="block rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-muted hover:text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper">
                      {t.label}
                      {t.value === person.closeness && " · was"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-xs text-muted">
              {name} goes back on the tiers{moments > 0 && ` with all ${moments} ${moments === 1 ? "moment" : "moments"}`}.
            </p>
            {error && (
              <p className="text-sm text-accent" aria-live="polite">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={bringBack}
              disabled={pending}
              className="mt-1 self-start rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
            >
              {pending ? "Bringing back…" : "Bring back"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
