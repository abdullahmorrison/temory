"use client";

import { Search, X } from "lucide-react";
import { useActionState, useState } from "react";
import type { ActivityFormState } from "@/app/(app)/activities/actions";
import { ActivityIcon } from "@/components/activity-icon";
import { SectionLabel } from "@/components/section-label";
import { StatusSwitch } from "@/components/status-switch";
import { WithPeople } from "@/components/with-people";
import { DEFAULT_ACTIVITY_ICON, searchIcons } from "@/lib/activity-icons";
import type { ActivityStatus } from "@/lib/activity-status";

type Props = {
  action: (prev: ActivityFormState, form: FormData) => Promise<ActivityFormState>;
  people: { id: number; name: string; color: number }[];
  submitLabel: string;
  defaults?: { name: string; icon: string; status: ActivityStatus; inTheWay: string; notes: string; personIds: number[] };
};

export function ActivityForm({ action, people, submitLabel, defaults }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [icon, setIcon] = useState(defaults?.icon ?? DEFAULT_ACTIVITY_ICON);
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState(defaults?.personIds ?? []);
  const [status, setStatus] = useState<ActivityStatus>(defaults?.status ?? "doing");
  // Kept while on Doing or Past, so switching away and back doesn't lose it.
  const [inTheWay, setInTheWay] = useState(defaults?.inTheWay ?? "");

  return (
    <>
      <form action={formAction} className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label="Pick an icon"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:border-muted"
          >
            <ActivityIcon icon={icon} size="1.375rem" strokeWidth={1.75} />
          </button>
          <input type="hidden" name="icon" value={icon} />
          <input
            name="name"
            required
            autoFocus={!defaults}
            autoComplete="off"
            placeholder="Name"
            defaultValue={defaults?.name}
            className="min-w-0 flex-1 border-b border-line bg-transparent pb-2 font-serif text-3xl outline-none placeholder:text-muted/60 focus:border-ink"
          />
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel as="span">In my life</SectionLabel>
          <StatusSwitch label="In my life" value={status} onChange={setStatus} />
          <input type="hidden" name="status" value={status} />
        </div>

        {status === "want" ? (
          <label className="flex flex-col gap-3">
            <SectionLabel as="span">What&apos;s in the way</SectionLabel>
            <input
              name="inTheWay"
              autoComplete="off"
              value={inTheWay}
              onChange={(e) => setInTheWay(e.target.value)}
              placeholder="Like “need a gym close by”"
              className="bg-transparent font-serif text-lg outline-none placeholder:text-muted/60"
            />
          </label>
        ) : (
          <input type="hidden" name="inTheWay" value={inTheWay} />
        )}

        <div className="flex flex-col gap-3">
          <SectionLabel as="span">With</SectionLabel>
          <WithPeople people={people} chosen={chosen} onChange={setChosen} />
          {chosen.map((id) => (
            <input key={id} type="hidden" name="personIds" value={id} />
          ))}
        </div>

        <label className="flex flex-col gap-3">
          <SectionLabel as="span">Notes</SectionLabel>
          <textarea
            name="notes"
            rows={4}
            defaultValue={defaults?.notes}
            placeholder="When, where, who brings what…"
            className="resize-none bg-transparent font-serif text-lg leading-relaxed outline-none placeholder:text-muted/60"
          />
        </label>

        {state.error && <p className="text-sm text-accent" aria-live="polite">{state.error}</p>}

        <button
          disabled={pending}
          className="self-start rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>
      {/* Outside the form, so Enter in its search doesn't submit the activity. */}
      {picking && (
        <IconPicker
          current={icon}
          onPick={(key) => {
            setIcon(key);
            setPicking(false);
          }}
          onClose={() => setPicking(false)}
        />
      )}
    </>
  );
}

/** A sheet from the bottom on phones, a dialog on desktop, with every icon and a search. */
function IconPicker({ current, onPick, onClose }: { current: string; onPick: (key: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const icons = searchIcons(query);
  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/25 desk:items-center desk:justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Pick an icon"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="w-full rounded-t-3xl bg-paper px-7 pt-3 pb-10 shadow-(--shadow-pop) desk:w-110 desk:rounded-3xl desk:pt-7 desk:pb-8"
      >
        <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-line desk:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">Pick an icon</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink">
            <X size="1.25rem" />
          </button>
        </div>
        <label className="mt-5 flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 text-muted">
          <Search size="1.125rem" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons"
            className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-ink outline-none placeholder:text-muted"
          />
        </label>
        {/* On phones the sheet keeps its height while searching: if it shrank with the results, it would
            sink behind the keyboard. content-start keeps the rows at the top instead of stretching them. */}
        <div className="mt-5 grid h-[50dvh] grid-cols-6 content-start gap-2 overflow-y-auto desk:h-auto desk:max-h-[50dvh]">
          {icons.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              aria-label={key.replace(/-\d$/, "").replace(/-/g, " ")}
              aria-pressed={key === current}
              className={`flex aspect-square items-center justify-center rounded-xl border transition-colors ${
                key === current ? "border-accent bg-clay text-accent" : "border-transparent text-ink hover:bg-surface"
              }`}
            >
              <ActivityIcon icon={key} size="1.375rem" strokeWidth={1.75} />
            </button>
          ))}
          {icons.length === 0 && <p className="col-span-6 py-6 text-center text-sm text-muted">No icons match</p>}
        </div>
      </div>
    </div>
  );
}
