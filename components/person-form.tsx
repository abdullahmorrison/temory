"use client";

import { useActionState, useState } from "react";
import type { PersonFormState } from "@/app/(app)/people/actions";
import { EmojiBadge } from "@/components/emoji-badge";
import { SectionLabel } from "@/components/section-label";
import { TypePicker } from "@/components/type-picker";
import { initials } from "@/lib/names";
import { personColor } from "@/lib/person-colors";
import type { RelationshipType } from "@/lib/relationship-types";
import { NEW_PERSON_CLOSENESS, TIERS } from "@/lib/tiers";

type Props = {
  action: (prev: PersonFormState, form: FormData) => Promise<PersonFormState>;
  submitLabel: string;
  color: number; // the person's avatar color, for the preview
  types: RelationshipType[];
  defaults?: { name: string; closeness: number; typeId: number | null; notes: string };
};

export function PersonForm({ action, submitLabel, color, types, defaults }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [name, setName] = useState(defaults?.name ?? "");
  const [type, setType] = useState(types.find((t) => t.id === defaults?.typeId) ?? null);
  const c = personColor(color);
  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span
          aria-hidden
          className={`relative flex size-16 shrink-0 items-center justify-center rounded-full font-serif text-[1.375rem] shadow-(--shadow-avatar) ring-2 ring-halo ${c.fill} ${c.ink}`}
        >
          {initials(name)}
          <EmojiBadge emoji={type?.emoji ?? ""} />
        </span>
        <input
          name="name"
          required
          autoFocus={!defaults}
          autoComplete="off"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 border-b border-line bg-transparent pb-2 font-serif text-3xl outline-none placeholder:text-muted/60 focus:border-ink"
        />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel as="span">Relationship type</SectionLabel>
        <TypePicker types={types} value={type} onChange={setType} />
        <input type="hidden" name="typeId" value={type?.id ?? ""} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <SectionLabel as="legend" className="mb-3">
          How close
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t) => (
            <label key={t.value} className="cursor-pointer">
              <input
                type="radio"
                name="closeness"
                value={t.value}
                defaultChecked={t.value === (defaults?.closeness ?? NEW_PERSON_CLOSENESS)}
                className="peer sr-only"
              />
              <span className="block rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-muted hover:text-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:ring-2 peer-focus-visible:ring-ink peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-paper">
                {t.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-3">
        <SectionLabel as="span">Notes</SectionLabel>
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaults?.notes}
          placeholder="How you met, what matters to them…"
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
  );
}

