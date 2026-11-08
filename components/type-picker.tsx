"use client";

import { Check, ChevronDown, Pencil, Plus, SmilePlus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { addRelationshipType, editRelationshipType, removeRelationshipType, type TypeResult } from "@/app/(app)/people/actions";
import { lastEmoji } from "@/lib/emoji";
import { listNames } from "@/lib/names";
import type { RelationshipType } from "@/lib/relationship-types";

// `person` is whoever the form is for, so the warning before deleting a type can name them.
type Props = { types: RelationshipType[]; value: RelationshipType | null; onChange: (id: number | null) => void; person: Person };
type Person = { id?: number; name: string };

// What the list is doing besides picking: making a type, or editing or deleting one of yours.
type Mode = { kind: "pick" } | { kind: "new" } | { kind: "edit"; id: number } | { kind: "delete"; id: number };

/**
 * A dropdown of relationship types that floats over the form: None, presets, then yours, then a row to
 * make a new one. Your own types can be edited or deleted from it. Escape backs out of an edit, then
 * closes it, as does a tap outside.
 */
export function TypePicker({ types, value, onChange, person }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: "pick" });

  const close = () => {
    setOpen(false);
    setMode({ kind: "pick" });
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mode.kind === "pick") close();
      else setMode({ kind: "pick" });
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mode.kind]);

  const pick = (id: number | null) => {
    onChange(id);
    close();
  };
  const back = () => setMode({ kind: "pick" });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        className={`flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.75 text-left text-[0.9375rem] transition-colors ${open ? "border-accent ring-[0.5px] ring-accent" : "border-line hover:border-muted"}`}
      >
        {value ? (
          <>
            <span className="text-xl leading-none">{value.emoji}</span>
            <span className="flex-1 truncate">{value.name}</span>
          </>
        ) : (
          <span className="flex-1 text-muted">Choose a type</span>
        )}
        <ChevronDown size="1rem" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 mt-1.5 rounded-2xl border border-line bg-surface p-1.5 shadow-(--shadow-pop)">
          <Option type={null} picked={!value} onPick={pick} />
          {types
            .filter((t) => t.preset)
            .map((t) => (
              <Option key={t.id} type={t} picked={t.id === value?.id} onPick={pick} />
            ))}
          <div className="mx-2.5 my-1.5 border-t border-line" />
          <p className="px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.12em] text-muted uppercase">Yours</p>
          {types
            .filter((t) => !t.preset)
            .map((t) =>
              mode.kind === "edit" && mode.id === t.id ? (
                <div key={t.id}>
                  <TypeEditor type={t} submitLabel="Save" save={(name, emoji) => editRelationshipType(t.id, name, emoji)} onSaved={back} />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setMode({ kind: "delete", id: t.id })}
                      className="flex items-center gap-2 rounded-[0.625rem] px-2.5 py-1.75 text-sm text-accent hover:bg-paper"
                    >
                      <Trash2 size="0.875rem" />
                      Delete type
                    </button>
                    <button type="button" onClick={back} className="rounded-[0.625rem] px-2.5 py-1.75 text-sm text-muted hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : mode.kind === "delete" && mode.id === t.id ? (
                <ConfirmDeleteType key={t.id} type={t} who={whoLoses(t, person, t.id === value?.id)} onDone={back} />
              ) : (
                <div key={t.id} className="flex items-center">
                  <Option type={t} picked={t.id === value?.id} onPick={pick} />
                  <button
                    type="button"
                    onClick={() => setMode({ kind: "edit", id: t.id })}
                    aria-label={`Edit ${t.name}`}
                    className="ml-1 flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-paper hover:text-ink"
                  >
                    <Pencil size="0.875rem" />
                  </button>
                </div>
              ),
            )}
          {mode.kind === "new" ? (
            <TypeEditor submitLabel="Add" save={addRelationshipType} onSaved={(id) => pick(id)} />
          ) : (
            <button
              type="button"
              onClick={() => setMode({ kind: "new" })}
              className="flex w-full items-center gap-3 rounded-[0.625rem] px-2.5 py-1.75 text-[0.9375rem] text-accent hover:bg-paper"
            >
              <span className="flex w-5 justify-center">
                <Plus size="1rem" />
              </span>
              New type
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** One type, or None for `type={null}`. */
function Option({ type, picked, onPick }: { type: RelationshipType | null; picked: boolean; onPick: (id: number | null) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(type?.id ?? null)}
      aria-pressed={picked}
      className={`flex w-full min-w-0 items-center gap-3 rounded-[0.625rem] px-2.5 py-1.75 text-left text-[0.9375rem] ${picked ? "bg-paper" : "hover:bg-paper"}`}
    >
      {type ? (
        <span className="w-5 text-center text-xl leading-none">{type.emoji}</span>
      ) : (
        <span className="flex w-5 justify-center">
          <span className="size-3.5 rounded-full border-[1.25px] border-dashed border-muted" />
        </span>
      )}
      <span className={`flex-1 truncate ${type ? "" : "text-muted"}`}>{type?.name ?? "None"}</span>
      {picked && <Check size="1rem" className="text-accent" />}
    </button>
  );
}

/** An emoji box, a name, and a button, for making a type or editing one of yours. Saves right away. */
function TypeEditor({
  type,
  submitLabel,
  save,
  onSaved,
}: {
  type?: RelationshipType;
  submitLabel: string;
  save: (name: string, emoji: string) => Promise<TypeResult>;
  onSaved: (id: number) => void;
}) {
  const [emoji, setEmoji] = useState(type?.emoji ?? "");
  const [name, setName] = useState(type?.name ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const submit = () =>
    startTransition(async () => {
      const result = await save(name, emoji);
      if (result.id) onSaved(result.id);
      else setError(result.error ?? "");
    });
  // Enter saves the type rather than submitting the person form around it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    submit();
  };

  return (
    <div className="flex flex-col gap-1 rounded-[0.625rem] bg-paper p-2">
      <div className="flex items-center gap-2.5">
        <label className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted">
          {!emoji && <SmilePlus size="1rem" className="pointer-events-none absolute text-muted" />}
          <input
            autoFocus={!type}
            autoComplete="off"
            aria-label="Its emoji"
            value={emoji}
            onChange={(e) => setEmoji(lastEmoji(e.target.value))}
            onKeyDown={onKeyDown}
            className="size-full bg-transparent text-center text-xl caret-transparent outline-none"
          />
        </label>
        <input
          autoFocus={!!type}
          autoComplete="off"
          aria-label="Type name"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 border-b-[1.5px] border-ink bg-transparent pb-1 text-[0.9375rem] outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="rounded-full bg-accent px-3.5 py-1.75 text-sm font-medium text-on-accent transition hover:brightness-110 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
      <p className={`px-0.5 text-xs ${error ? "text-accent" : "text-muted"}`} aria-live="polite">
        {error || "Tap the box to pick its emoji."}
      </p>
    </div>
  );
}

/**
 * Who deleting a type leaves without one: those saved with it, going by this form's pick for its own
 * person, since that's what saving the form will keep.
 */
function whoLoses(type: RelationshipType, person: Person, picked: boolean) {
  const others = type.people.filter((p) => p.id !== person.id).map((p) => p.name);
  return picked ? [person.name.trim() || "This person", ...others] : others;
}

/** Asks before deleting one of your types, naming who it leaves without one. */
function ConfirmDeleteType({ type, who, onDone }: { type: RelationshipType; who: string[]; onDone: () => void }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const remove = () =>
    startTransition(async () => {
      const result = await removeRelationshipType(type.id);
      if (result.error) setError(result.error);
      else onDone();
    });

  return (
    <div className="flex flex-col gap-2.5 rounded-[0.625rem] bg-paper p-3">
      <p className="text-[0.9375rem]">
        Delete {type.emoji} {type.name}?
      </p>
      <p className={`text-xs ${error ? "text-accent" : "text-muted"}`} aria-live="polite">
        {error || (who.length ? `${listNames(who)} will have no type. Nothing else about them changes.` : "Nobody has it yet.")}
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="rounded-full bg-accent px-3.5 py-1.75 text-sm font-medium text-on-accent transition hover:brightness-110 disabled:opacity-60"
        >
          Delete
        </button>
        <button type="button" onClick={onDone} className="text-sm text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
