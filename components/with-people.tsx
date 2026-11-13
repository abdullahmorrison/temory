"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { firstName } from "@/lib/names";
import { personColor } from "@/lib/person-colors";

type Person = { id: number; name: string; color: number; endedAt?: string | null };

/**
 * "with Sam Priya + someone": chips for who was there, and a search to add more. Someone there only
 * because of a mention (`linked`) is dashed, and tapping locks them in; tapping anyone else removes them.
 * Past relationships can't be added, but stay where they already are.
 */
export function WithPeople({
  people,
  chosen,
  linked = [],
  onChange,
  onLock,
  label,
  empty,
}: {
  people: Person[];
  chosen: number[];
  linked?: number[];
  onChange: (ids: number[]) => void;
  onLock?: (id: number) => void;
  /** Shown before the chips, like "with". */
  label?: string;
  /** Shown when no one is chosen, like "just me". */
  empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const byId = new Map(people.map((p) => [p.id, p]));
  const matches = people
    .filter((p) => !p.endedAt && !chosen.includes(p.id) && p.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 6);
  const add = (id: number) => {
    onChange([...chosen, id]);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative flex flex-wrap items-center gap-1.5 text-[0.8125rem]">
      {label && <span className="text-muted">{label}</span>}
      {chosen.map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        const c = personColor(p.color);
        if (linked.includes(id)) {
          const label = `Keep ${firstName(p.name)} in this moment`;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onLock?.(id)}
              aria-label={label}
              title={label}
              className={`rounded-full border border-dashed border-current/45 px-2.5 py-px font-medium transition-colors ${c.ink} ${c.hover}`}
            >
              {p.name}
            </button>
          );
        }
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(chosen.filter((x) => x !== id))}
            aria-label={`Remove ${p.name}`}
            className={`group flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium transition-[filter] hover:brightness-95 ${c.fill} ${c.ink}`}
          >
            {p.name}
            <X size="0.75rem" className="opacity-50 group-hover:opacity-100" />
          </button>
        );
      })}
      {empty && chosen.length === 0 && !open && <span className="text-muted">{empty}</span>}

      {open ? (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (matches[0]) add(matches[0].id);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search people"
          className="w-36 border-b border-line bg-transparent py-0.5 outline-none focus:border-ink"
        />
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-accent hover:bg-surface">
          <Plus size="0.8125rem" />
          someone
        </button>
      )}

      {open && (
        <ul className="absolute top-full left-0 z-10 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-raised py-1 shadow-(--shadow-pop)">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-muted">{people.length ? "No one matches" : "Add people first"}</li>
          ) : (
            matches.map((p, i) => {
              const c = personColor(p.color);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => add(p.id)}
                    className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-surface ${i === 0 ? "bg-surface/60" : ""}`}
                  >
                    <span className={`size-2.5 rounded-full ${c.fill} ring-1 ring-black/5`} />
                    {p.name}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
