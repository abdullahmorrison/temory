"use client";

import { ChevronRight, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { EmojiBadge } from "@/components/emoji-badge";
import { PlacesMap, type MapPlace } from "@/components/places-map";
import { useIsDesk } from "@/components/use-is-desk";
import { initials } from "@/lib/names";
import { personColor } from "@/lib/person-colors";
import type { Place } from "@/lib/places";
import { tierLabel } from "@/lib/tiers";

// Phones: the sheet covers the bottom of the map, so centring on a place keeps this much clear.
const SHEET_ROOM = { top: 110, bottom: 340 };

/** The selected place lives in the URL (?place=3), so the list and the map agree and Back undoes it. */
function useSelection() {
  const router = useRouter();
  const id = Number(useSearchParams().get("place")) || undefined;
  const select = useCallback((next?: number) => router.replace(next ? `/places?place=${next}` : "/places", { scroll: false }), [router]);
  return [id, select] as const;
}

const toMap = (places: Place[]): MapPlace[] => places.map((p) => ({ id: p.id, title: p.title, count: p.people.length, lat: p.lat, lng: p.lng }));
const summary = (p: Place) => [p.area, `${p.people.length} ${p.people.length === 1 ? "person" : "people"}`].filter(Boolean).join("  ·  ");

/** Desktop: the map beside the list or form. Phones show their own map on the Places page instead. */
export function DeskMap({ places }: { places: Place[] }) {
  const desk = useIsDesk();
  const [selected, select] = useSelection();
  const pins = useMemo(() => toMap(places), [places]);
  if (!desk) return null;
  return <PlacesMap places={pins} selectedId={selected} onSelect={select} onBackground={() => select()} className="h-dvh min-w-0 flex-1" />;
}

/** The Places tab: the list on desktop; on phones a full-screen map with the selected place in a sheet. */
export function PlacesHome({ places }: { places: Place[] }) {
  const desk = useIsDesk();
  const [selectedId, select] = useSelection();
  const pins = useMemo(() => toMap(places), [places]);
  const selected = places.find((p) => p.id === selectedId);

  if (desk) return <PlaceList places={places} selectedId={selectedId} />;
  return (
    <div className="relative -mb-28 h-dvh overflow-hidden">
      {/* MapLibre makes its own box position: relative, so a wrapper does the filling. */}
      <div className="absolute inset-0">
        <PlacesMap
          places={pins}
          selectedId={selectedId}
          onSelect={select}
          onBackground={() => select()}
          padding={SHEET_ROOM}
          // MapLibre's own styles sit outside Tailwind's layers, so moving its credit below the header needs !.
          credit="top-right"
          className="size-full [&_.maplibregl-ctrl-top-right]:top-30!"
        />
      </div>
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-linear-to-b from-paper via-paper/80 to-transparent px-7 pt-14 pb-10">
        <div>
          <h1 className="text-[1.75rem] font-medium">Places</h1>
          <p className="mt-0.5 text-[0.8125rem] text-muted">Where your people are</p>
        </div>
        <Link
          href="/places/new"
          aria-label="Add a place"
          className="pointer-events-auto mt-1 flex size-10 items-center justify-center rounded-full border border-line bg-paper transition-colors hover:border-muted"
        >
          <Plus size="1.25rem" />
        </Link>
      </header>
      {places.length === 0 && (
        <div className="absolute inset-x-7 top-1/2 -translate-y-1/2 rounded-2xl bg-paper/95 px-6 py-5 text-center shadow-(--shadow-pop)">
          <p className="font-serif text-[1.375rem]">No places yet.</p>
          <p className="mt-1 text-[0.8125rem] text-muted">Add the places you see your people.</p>
          <Link href="/places/new" className="mt-2 inline-block text-[0.8125rem] font-medium text-accent">
            Add your first place
          </Link>
        </div>
      )}
      {selected && (
        <section className="absolute inset-x-0 bottom-0 z-10 max-h-[60dvh] overflow-y-auto rounded-t-3xl bg-paper px-7 pt-3 pb-[calc(max(env(safe-area-inset-bottom),12px)+88px)] shadow-(--shadow-pop)">
          <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-line" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-[1.375rem] font-medium">{selected.title}</h2>
              <p className="mt-0.5 text-[0.8125rem] text-muted">{summary(selected)}</p>
            </div>
            <Link href={`/places/${selected.id}/edit`} className="mt-1 text-sm text-muted hover:text-ink">
              Edit
            </Link>
          </div>
          <PlacePeople place={selected} />
        </section>
      )}
    </div>
  );
}

/** Desktop list: every place, the selected one opened up to show who goes there. */
function PlaceList({ places, selectedId }: { places: Place[]; selectedId?: number }) {
  return (
    <div className="px-6 pt-8 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[1.375rem] font-medium">Places</h1>
          <p className="mt-0.5 text-[0.8125rem] text-muted">
            {places.length} {places.length === 1 ? "place" : "places"}
          </p>
        </div>
        <Link href="/places/new" className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-muted hover:bg-surface">
          <Plus size="1rem" />
          Add place
        </Link>
      </div>
      {places.length === 0 && <p className="mt-10 text-[0.8125rem] text-muted">No places yet. Add the places you see your people.</p>}
      <ul className="mt-6 flex flex-col gap-1">
        {places.map((p) => {
          const open = p.id === selectedId;
          return (
            <li key={p.id} className={`rounded-2xl transition-colors ${open ? "bg-surface" : ""}`}>
              <Link
                href={open ? "/places" : `/places?place=${p.id}`}
                replace
                scroll={false}
                aria-expanded={open}
                className={`flex items-start gap-3 rounded-2xl px-3.5 py-3 ${open ? "" : "hover:bg-surface/70"}`}
              >
                <MapPin size="1.125rem" className={`mt-0.5 shrink-0 ${open ? "text-accent" : "text-muted"}`} />
                <span className="min-w-0">
                  <span className="block truncate text-[0.9375rem]">{p.title}</span>
                  <span className="block text-xs text-muted">{summary(p)}</span>
                </span>
              </Link>
              {open && (
                <div className="px-3.5 pb-3">
                  <PlacePeople place={p} compact />
                  <Link href={`/places/${p.id}/edit`} className="mt-2 ml-8 inline-block text-[0.8125rem] text-muted hover:text-ink">
                    Edit place
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Who goes to a place, closest first, each a link to their profile. */
function PlacePeople({ place, compact }: { place: Place; compact?: boolean }) {
  if (!place.people.length) return <p className={`text-[0.8125rem] text-muted ${compact ? "ml-8" : "mt-5"}`}>No one here yet.</p>;
  return (
    <ul className={compact ? "ml-5 flex flex-col" : "mt-4 flex flex-col"}>
      {place.people.map((person) => {
        const color = personColor(person.color);
        return (
          <li key={person.id}>
            <Link
              href={`/people/${person.id}`}
              className={`-mx-3 flex items-center gap-3 rounded-xl px-3 transition-colors hover:bg-surface/70 ${compact ? "py-1.5" : "py-2.5"}`}
            >
              <span
                className={`relative flex shrink-0 items-center justify-center rounded-full font-serif ring-2 ring-halo ${compact ? "size-7 text-[0.6875rem]" : "size-10 text-sm"} ${color.fill} ${color.ink}`}
              >
                {initials(person.name)}
                <EmojiBadge emoji={person.emoji} />
              </span>
              <span className={`flex min-w-0 flex-1 ${compact ? "items-baseline gap-2.5" : "flex-col"}`}>
                <span className={`truncate ${compact ? "text-[0.8125rem]" : "text-[0.9375rem]"}`}>{person.name}</span>
                <span className="text-xs text-muted">{tierLabel(person.closeness)}</span>
              </span>
              {!compact && <ChevronRight size="1.125rem" className="text-muted" />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
