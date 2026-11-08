"use client";

import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useOptimistic, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { movePerson } from "@/app/(app)/people/actions";
import { usePressDrag, type Point } from "@/components/use-press-drag";
import { EmojiBadge } from "@/components/emoji-badge";
import { firstName, initials } from "@/lib/names";
import { personColor } from "@/lib/person-colors";
import { layoutTiers, tierAt, type LayoutPerson } from "@/lib/tier-layout";
import { ACQUAINTANCE, PROSPECT, TIERS, tierLabel } from "@/lib/tiers";

// Everything is placed with transforms, which the browser can move without redoing layout.
// When the side panel opens or closes, the arcs snap to their new size with no animation.
const at = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;
// Bubbles pop in one after another, capped so a bubble that appears later (say, an overflow
// bubble when the panel narrows the arcs) never waits long to show.
const stagger = (i: number) => Math.min(i * 25, 250);
const BAND_FILLS = ["fill-band-1", "fill-band-2", "fill-band-3", "fill-band-4"];
const DESK_QUERY = "(min-width: 1024px)"; // matches the `desk` breakpoint in globals.css
// Phones: the Prospects band sits above the screen, this much of it peeking under the header.
// Scroll up to see the rest.
const PEEK = 115;

function useIsDesk() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESK_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESK_QUERY).matches,
    () => false,
  );
}

type Drag = { person: LayoutPerson; size: number; x: number; y: number; tier?: number };

export function PeopleTiers({ people: saved }: { people: LayoutPerson[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  // A dropped person moves right away; the save runs in the background and undoes itself on error.
  const [people, moveLocally] = useOptimistic(saved, (state, m: { id: number; closeness: number }) =>
    state.map((p) => (p.id === m.id ? { ...p, closeness: m.closeness } : p)),
  );
  const [, startTransition] = useTransition();
  const [drag, setDrag] = useState<Drag | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number; scale: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Next.js keeps this screen mounted but hidden (0×0) while you're on another tab. Keep the
      // last real layout, or the arcs would glide in from a collapsed one when you come back.
      // The root font size grows with the window (app/globals.css); the arcs' px sizes grow with it.
      const scale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      if (width > 0 && height > 0) setSize({ width, height, scale });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const desk = useIsDesk();
  const selectedId = Number(usePathname().match(/^\/people\/(\d+)/)?.[1]);
  const scale = size?.scale ?? 1;
  const top = (desk ? 110 : 96) * scale;
  const bottom = (desk ? 40 : 150) * scale;
  const extra = !size || desk ? 0 : Math.max(0, (size.height - top - bottom) / (TIERS.length - 1) - PEEK * scale);
  const layout = size && layoutTiers(people, { width: size.width, height: size.height + extra, tiers: TIERS, top, bottom, scale });
  const known = people.filter((p) => p.closeness !== PROSPECT).length;
  const prospects = people.length - known;

  // Open at the bottom, closest tier in view, the first time there's anything to scroll. Only
  // once, so coming back keeps your scroll.
  const opened = useRef(false);
  useLayoutEffect(() => {
    if (!extra || opened.current || !scroller.current) return;
    opened.current = true;
    scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [extra]);

  const local = (p: Point) => {
    const box = canvas.current!.getBoundingClientRect();
    return { x: p.clientX - box.left, y: p.clientY - box.top };
  };
  const dragTo = (person: LayoutPerson, size: number, p: Point) => {
    const point = local(p);
    setDrag({ person, size, ...point, tier: layout ? tierAt(layout, point) : undefined });
  };
  const drop = (person: LayoutPerson, p: Point) => {
    const tier = layout ? tierAt(layout, local(p)) : undefined;
    setDrag(null);
    if (!tier || tier === person.closeness) return;
    setError(null);
    startTransition(async () => {
      moveLocally({ id: person.id, closeness: tier });
      const result = await movePerson(person.id, tier);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div ref={ref} className="relative -mb-28 h-dvh overflow-hidden desk:mb-0">
      <div ref={scroller} className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none]">
        <div ref={canvas} style={{ height: size ? size.height + extra : undefined }} className="relative overflow-hidden">
          {layout && (
            <>
              {[...layout.bands].reverse().map((band, i) => (
                <Circle
                  key={band.tier}
                  cx={layout.center.x}
                  cy={layout.center.y}
                  r={band.outerRadius}
                  dashed={band.tier === PROSPECT}
                  className={
                    drag?.tier === band.tier
                      ? "fill-accent/10 stroke-accent"
                      : band.tier === PROSPECT
                        ? "fill-paper stroke-line"
                        : `${BAND_FILLS[Math.min(layout.bands.length - 1 - i, BAND_FILLS.length - 1)]} stroke-line`
                  }
                />
              ))}
              {/* The closest tier also fills everything below its arc. */}
              <Circle
                cx={layout.center.x}
                cy={layout.center.y}
                r={layout.innerRadius}
                className={drag?.tier === layout.bands[0]?.tier ? "fill-accent/10" : "fill-band-1"}
              />

              {layout.bands.map((band) => (
                <p
                  key={band.tier}
                  style={{ transform: `${at(layout.center.x, band.labelY)} translateX(-50%)` }}
                  className={`absolute top-0 left-0 whitespace-nowrap text-[0.625rem] font-medium tracking-[0.14em] uppercase ${drag?.tier === band.tier ? "text-accent" : "text-muted"}`}
                >
                  {band.label} · {band.count}
                </p>
              ))}

              {layout.bubbles.map((b, i) =>
                b.kind === "person" ? (
                  <PersonBubble
                    key={b.person.id}
                    person={b.person}
                    x={b.x}
                    y={b.y}
                    size={b.size}
                    pad={20 * scale}
                    delay={stagger(i)}
                    selected={b.person.id === selectedId}
                    lifted={drag?.person.id === b.person.id}
                    onDrag={(p) => dragTo(b.person, b.size, p)}
                    onDrop={(p) => drop(b.person, p)}
                    onCancel={() => setDrag(null)}
                  />
                ) : (
                  <Link
                    key={`more-${b.tier}`}
                    href={`/people/tiers/${b.tier}`}
                    aria-label={`${b.hidden} more, see everyone in ${tierLabel(b.tier)}`}
                    style={{ transform: at(b.x - b.size / 2, b.y - b.size / 2), width: b.size }}
                    className="group absolute top-0 left-0 rounded-lg outline-none"
                  >
                    <div style={{ animationDelay: `${stagger(i)}ms` }} className="flex flex-col items-center gap-1.5 motion-safe:animate-pop-in">
                      <span
                        style={{ width: b.size, height: b.size }}
                        className="flex items-center justify-center rounded-full border border-dashed border-muted text-sm font-medium transition group-hover:border-ink group-hover:bg-surface group-focus-visible:border-ink group-active:scale-95"
                      >
                        +{b.hidden}
                      </span>
                      <span className="text-[0.6875rem] text-muted">more</span>
                    </div>
                  </Link>
                ),
              )}
            </>
          )}

          {drag && (
            <span
              style={{ transform: `${at(drag.x - drag.size / 2, drag.y - drag.size / 2)} scale(1.12)`, width: drag.size, height: drag.size, fontSize: Math.round(drag.size * 0.34) }}
              className={`pointer-events-none absolute top-0 left-0 z-10 flex items-center justify-center rounded-full font-serif shadow-(--shadow-drag) ${face(drag.person).className}`}
            >
              {face(drag.person).text}
              <EmojiBadge emoji={drag.person.emoji} />
            </span>
          )}

          {people.length === 0 && layout && <EmptyPrompt bands={layout.bands} scale={scale} />}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="absolute inset-x-0 bottom-40 mx-auto w-fit rounded-full bg-ink px-4 py-2 text-[0.8125rem] text-paper shadow-lg desk:bottom-10"
        >
          {error}
        </p>
      )}

      {/* Fades out prospects scrolling up under it on phones. */}
      <header className="absolute inset-x-0 top-0 flex items-center justify-between bg-linear-to-b from-paper from-80% to-transparent px-7 pt-12 pb-4 desk:bg-none desk:px-10 desk:pt-8 desk:pb-0">
        <div>
          <h1 className="hidden text-2xl font-medium desk:block">People</h1>
          <p className="text-[0.8125rem] text-muted">
            {known} {known === 1 ? "person" : "people"}
            {prospects > 0 && ` · ${prospects} ${prospects === 1 ? "prospect" : "prospects"}`}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Desktop reaches Settings from the sidebar. */}
          <Link href="/settings" aria-label="Settings" className={`${HEADER_BUTTON} desk:hidden`}>
            <Settings size="1.125rem" />
          </Link>
          <Link href="/people/new" aria-label="Add person" className={`${HEADER_BUTTON} desk:px-4 desk:py-2`}>
            <Plus size="1.125rem" />
            <span className="hidden desk:inline">Add person</span>
          </Link>
        </div>
      </header>
    </div>
  );
}

const HEADER_BUTTON =
  "flex items-center gap-1.5 rounded-full border border-line bg-paper p-2.5 text-sm font-medium transition-colors hover:border-muted hover:bg-surface";

/** Centred inside a middle band, clear of the tier labels and arc edges. */
function EmptyPrompt({ bands, scale }: { bands: { labelY: number }[]; scale: number }) {
  const i = Math.floor(bands.length / 2);
  const top = bands[i].labelY + 22 * scale;
  const bottom = bands[i - 1].labelY - 12 * scale;
  return (
    <div style={{ top, height: bottom - top }} className="absolute inset-x-0 flex flex-col items-center justify-center gap-1.5 px-8 text-center">
      <p className="font-serif text-[1.375rem]">No one here yet.</p>
      <p className="text-[0.8125rem] text-muted">Add the people in your life, closest at the bottom.</p>
      <Link href="/people/new" className="mt-1 text-[0.8125rem] font-medium text-accent underline-offset-4 hover:underline">
        Add your first person
      </Link>
    </div>
  );
}

// Circles are drawn once at this radius and scaled into place, so resizing them is a transform.
// The stroke doesn't scale, so the edge line stays 1px at any size.
const UNIT = 1000;

function Circle({ cx, cy, r, className, dashed }: { cx: number; cy: number; r: number; className: string; dashed?: boolean }) {
  return (
    <svg
      width={UNIT * 2}
      height={UNIT * 2}
      aria-hidden
      style={{ transform: `${at(cx - UNIT, cy - UNIT)} scale(${r / UNIT})` }}
      className={`absolute top-0 left-0 overflow-visible`}
    >
      <circle cx={UNIT} cy={UNIT} r={UNIT} className={className} vectorEffect="non-scaling-stroke" strokeDasharray={dashed ? "4 4" : undefined} />
    </svg>
  );
}

type BubbleProps = {
  person: LayoutPerson;
  x: number;
  y: number;
  size: number;
  pad: number; // room each side of the bubble for its name
  delay: number;
  selected: boolean;
  lifted: boolean;
  onDrag: (p: Point) => void;
  onDrop: (p: Point) => void;
  onCancel: () => void;
};

/** A filled circle in the person's color; prospects get just an outline, since you don't know them yet. */
function face(person: LayoutPerson, selected = false) {
  const color = personColor(person.color);
  const prospect = person.closeness === PROSPECT;
  const ring = selected ? "ring-[2.5px] ring-accent" : prospect ? "ring-[1.5px] ring-current" : "ring-2 ring-halo";
  return {
    className: `${ring} ${color.ink} ${prospect ? "bg-paper" : color.fill}`,
    text: prospect ? initials(person.name).slice(0, 1) : initials(person.name),
  };
}

function PersonBubble({ person, x, y, size, pad, delay, selected, lifted, onDrag, onDrop, onCancel }: BubbleProps) {
  const look = face(person, selected);
  const drag = usePressDrag({ onStart: onDrag, onMove: onDrag, onDrop, onCancel });
  return (
    <Link
      href={`/people/${person.id}`}
      {...drag}
      style={{ transform: at(x - size / 2 - pad, y - size / 2), width: size + 2 * pad }}
      className={`group absolute top-0 left-0 touch-none rounded-lg outline-none select-none [-webkit-touch-callout:none] ${lifted ? "opacity-30" : ""}`}
    >
      {/* The entrance animation lives on an inner element so it doesn't fight the glide. */}
      <div style={{ animationDelay: `${delay}ms` }} className="flex flex-col items-center gap-1.5 motion-safe:animate-pop-in">
        <span
          style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
          className={`relative flex items-center justify-center rounded-full font-serif shadow-(--shadow-avatar) transition group-hover:shadow-(--shadow-avatar-lift) group-focus-visible:ring-ink group-active:scale-95 motion-safe:group-hover:-translate-y-0.5 ${look.className}`}
        >
          {look.text}
          <EmojiBadge emoji={person.emoji} />
        </span>
        <span className={`max-w-full truncate text-xs ${selected ? "font-medium" : person.closeness >= ACQUAINTANCE ? "text-muted" : ""}`}>
          {firstName(person.name)}
        </span>
      </div>
    </Link>
  );
}
