"use client";

import { Check, ChevronDown, Plus, SmilePlus } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { addRelationshipType } from "@/app/(app)/people/actions";
import { lastEmoji } from "@/lib/emoji";
import type { RelationshipType } from "@/lib/relationship-types";

type Props = { types: RelationshipType[]; value: RelationshipType | null; onChange: (type: RelationshipType | null) => void };

/**
 * A dropdown of relationship types that floats over the form: presets, then yours, then a row to make
 * a new one. Tapping the picked type again clears it. Escape or a tap outside closes it.
 */
export function TypePicker({ types: saved, value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [types, setTypes] = useState(saved);

  const close = () => {
    setOpen(false);
    setCreating(false);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (type: RelationshipType | null) => {
    onChange(type);
    close();
  };
  const presets = types.filter((t) => t.preset);
  const yours = types.filter((t) => !t.preset);

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
          {presets.map((t) => (
            <Option key={t.id} type={t} picked={t.id === value?.id} onPick={pick} />
          ))}
          <div className="mx-2.5 my-1.5 border-t border-line" />
          <p className="px-2.5 py-1 text-[0.6875rem] font-medium tracking-[0.12em] text-muted uppercase">Yours</p>
          {yours.map((t) => (
            <Option key={t.id} type={t} picked={t.id === value?.id} onPick={pick} />
          ))}
          {creating ? (
            <NewType
              onAdd={(type) => {
                setTypes([...types, type]);
                pick(type);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
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

function Option({ type, picked, onPick }: { type: RelationshipType; picked: boolean; onPick: (type: RelationshipType | null) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(picked ? null : type)}
      aria-pressed={picked}
      className={`flex w-full items-center gap-3 rounded-[0.625rem] px-2.5 py-1.75 text-left text-[0.9375rem] ${picked ? "bg-paper" : "hover:bg-paper"}`}
    >
      <span className="w-5 text-center text-xl leading-none">{type.emoji}</span>
      <span className="flex-1 truncate">{type.name}</span>
      {picked && <Check size="1rem" className="text-accent" />}
    </button>
  );
}

/** An emoji box, a name, and Add. Saves the type right away, so it's there for the next person too. */
function NewType({ onAdd }: { onAdd: (type: RelationshipType) => void }) {
  const [emoji, setEmoji] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const add = () =>
    startTransition(async () => {
      const result = await addRelationshipType(name, emoji);
      if (result.type) onAdd(result.type);
      else setError(result.error ?? "");
    });
  // Enter adds the type rather than submitting the person form around it.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    add();
  };

  return (
    <div className="flex flex-col gap-1 rounded-[0.625rem] bg-paper p-2">
      <div className="flex items-center gap-2.5">
        <label className="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-muted">
          {!emoji && <SmilePlus size="1rem" className="pointer-events-none absolute text-muted" />}
          <input
            autoFocus
            autoComplete="off"
            aria-label="Its emoji"
            value={emoji}
            onChange={(e) => setEmoji(lastEmoji(e.target.value))}
            onKeyDown={onKeyDown}
            className="size-full bg-transparent text-center text-xl caret-transparent outline-none"
          />
        </label>
        <input
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
          onClick={add}
          disabled={pending}
          className="rounded-full bg-accent px-3.5 py-1.75 text-sm font-medium text-on-accent transition hover:brightness-110 disabled:opacity-60"
        >
          Add
        </button>
      </div>
      <p className={`px-0.5 text-xs ${error ? "text-accent" : "text-muted"}`} aria-live="polite">
        {error || "Tap the box to pick its emoji."}
      </p>
    </div>
  );
}
