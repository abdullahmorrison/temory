"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { bringPersonBack, endRelationshipWith } from "@/app/(app)/people/actions";
import { localToday } from "@/lib/dates";
import { firstName } from "@/lib/names";
import { TIERS } from "@/lib/tiers";

type Person = { id: number; name: string; closeness: number };
type Result = { error?: string };

const QUIET = "rounded-full border border-line text-[0.8125rem] transition-colors hover:border-muted hover:bg-surface";
const PRIMARY = "rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60";

/** Runs an action from a sheet, then refreshes the profile under it, or shows what went wrong. */
function useSheetAction() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<Result>) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) return setError(result.error);
      setOpen(false);
      router.refresh();
    });
  const show = () => {
    setError("");
    setOpen(true);
  };
  return { open, show, hide: () => setOpen(false), error, pending, run };
}

/** A sheet from the bottom on phones; on desktop, the bottom of the panel it's in. Escape or the scrim closes it. */
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 desk:left-auto desk:w-110">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/30" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-3xl bg-paper px-7 pt-3 pb-[calc(max(env(safe-area-inset-bottom),16px)+16px)] text-left shadow-(--shadow-pop)"
      >
        <div className="mx-auto h-1 w-9 rounded-full bg-line" />
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-[1.375rem] font-medium">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-ink">
            <X size="1.25rem" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetError({ error }: { error: string }) {
  if (!error) return null;
  return (
    <p className="text-sm text-accent" aria-live="polite">
      {error}
    </p>
  );
}

/** At the bottom of a current profile: asks first, since a stray tap would hide them from People. */
export function EndRelationship({ person, moments }: { person: Person; moments: number }) {
  const sheet = useSheetAction();
  const name = firstName(person.name);
  return (
    <>
      <button type="button" onClick={sheet.show} className={`mt-12 self-start px-4 py-2 font-medium ${QUIET}`}>
        End relationship
      </button>
      {sheet.open && (
        <Sheet title={`End things with ${name}?`} onClose={sheet.hide}>
          <p className="text-[0.8125rem] text-muted">
            {name} moves to Past. {moments > 0 && "Your moments together stay, and "}
            {moments > 0 ? "you" : "You"} can bring {name} back any time.
          </p>
          <SheetError error={sheet.error} />
          <div className="mt-1 flex items-center gap-4">
            {/* Ended on the day it is on your clock, like the dates of moments. */}
            <button type="button" onClick={() => sheet.run(() => endRelationshipWith(person.id, localToday()))} disabled={sheet.pending} className={PRIMARY}>
              {sheet.pending ? "Ending…" : "End relationship"}
            </button>
            <button type="button" onClick={sheet.hide} className="text-sm text-muted hover:text-ink">
              Cancel
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** On a past profile: asks which tier they're in now (where they were, to start), then puts them back. */
export function BringBack({ person, moments }: { person: Person; moments: number }) {
  const sheet = useSheetAction();
  const [tier, setTier] = useState(person.closeness);
  const name = firstName(person.name);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTier(person.closeness);
          sheet.show();
        }}
        className={`mt-3 px-4 py-1.5 ${QUIET}`}
      >
        Bring back
      </button>
      {sheet.open && (
        <Sheet title={`Bring ${name} back`} onClose={sheet.hide}>
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
          <SheetError error={sheet.error} />
          <button type="button" onClick={() => sheet.run(() => bringPersonBack(person.id, tier))} disabled={sheet.pending} className={`mt-1 self-start ${PRIMARY}`}>
            {sheet.pending ? "Bringing back…" : "Bring back"}
          </button>
        </Sheet>
      )}
    </>
  );
}
