"use client";

import { MapPin, Search } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import type { PlaceFormState } from "@/app/(app)/places/actions";
import { PlacesMap } from "@/components/places-map";
import { SectionLabel } from "@/components/section-label";
import { useIsDesk } from "@/components/use-is-desk";
import { WithPeople } from "@/components/with-people";
import { searchAddresses, type AddressResult } from "@/lib/photon";

type Props = {
  action: (prev: PlaceFormState, form: FormData) => Promise<PlaceFormState>;
  people: { id: number; name: string; color: number }[];
  submitLabel: string;
  defaults?: AddressResult & { alias: string; personIds: number[] };
};

/** An address picked from a search, what you call the place, and who goes there. */
export function PlaceForm({ action, people, submitLabel, defaults }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [address, setAddress] = useState<AddressResult | null>(defaults ?? null);
  const [chosen, setChosen] = useState(defaults?.personIds ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <SectionLabel as="span">Address</SectionLabel>
        {address ? <AddressCard address={address} onChange={() => setAddress(null)} /> : <AddressSearch onPick={setAddress} />}
        {address &&
          (["name", "address", "area", "lat", "lng"] as const).map((key) => <input key={key} type="hidden" name={key} value={address[key]} />)}
      </div>

      <label className="flex flex-col gap-3">
        <SectionLabel as="span">Call it</SectionLabel>
        <input
          name="alias"
          autoComplete="off"
          defaultValue={defaults?.alias}
          placeholder={address?.name ?? "Name"}
          className="border-b border-line bg-transparent pb-1.5 font-serif text-lg outline-none placeholder:text-muted/60 focus:border-ink"
        />
        <span className="text-xs text-muted">Optional. Shown instead of the address, like &ldquo;Sam&apos;s place&rdquo;.</span>
      </label>

      <div className="flex flex-col gap-3">
        <SectionLabel as="span">People</SectionLabel>
        <WithPeople people={people} chosen={chosen} onChange={setChosen} />
        {chosen.map((id) => (
          <input key={id} type="hidden" name="personIds" value={id} />
        ))}
      </div>

      {state.error && <p className="text-sm text-accent" aria-live="polite">{state.error}</p>}

      <button
        disabled={pending || !address}
        className="self-start rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/** Searches as you type, after a short pause so the free search service isn't asked on every key. */
function AddressSearch({ onPick }: { onPick: (address: AddressResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AddressResult[]>([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      searchAddresses(q, abort.signal)
        .then((found) => {
          setResults(found);
          setError("");
          setOpen(true);
        })
        .catch((e: Error) => e.name !== "AbortError" && setError(e.message));
    }, 350);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const short = query.trim().length < 3;
  return (
    <div ref={ref} className="relative">
      <label
        className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.75 transition-colors ${open && !short ? "border-accent ring-[0.5px] ring-accent" : "border-line focus-within:border-muted"}`}
      >
        <Search size="1rem" className="shrink-0 text-muted" />
        <input
          autoFocus
          autoComplete="off"
          aria-label="Search an address or place"
          placeholder="Search an address or place"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          // Enter picks the top result rather than submitting a form with no address.
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (results[0] && !short) onPick(results[0]);
          }}
          className="min-w-0 flex-1 bg-transparent text-[0.9375rem] outline-none placeholder:text-muted"
        />
      </label>
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
      {open && !short && results.length > 0 && (
        <div className="absolute inset-x-0 top-full z-10 mt-1.5 rounded-2xl border border-line bg-surface p-1.5 shadow-(--shadow-pop)">
          {results.map((r) => (
            <button
              key={`${r.lat},${r.lng},${r.name}`}
              type="button"
              onClick={() => onPick(r)}
              className="flex w-full items-start gap-3 rounded-[0.625rem] px-2.5 py-2 text-left hover:bg-paper"
            >
              <MapPin size="1rem" className="mt-0.5 shrink-0 text-muted" />
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem]">{r.name}</span>
                {r.address && <span className="block truncate text-xs text-muted">{r.address}</span>}
              </span>
            </button>
          ))}
          <p className="px-2.5 pt-1.5 pb-1 text-[0.6875rem] text-muted">Search by Photon · © OpenStreetMap</p>
        </div>
      )}
      {open && !short && results.length === 0 && !error && <p className="mt-2 text-xs text-muted">No matches yet. Keep typing.</p>}
    </div>
  );
}

/** The picked address: a small map with its pin (phones), its name and address, and a way to pick again. */
// Desktop has the big map beside the form, so only phones get the small one.
function AddressCard({ address, onChange }: { address: AddressResult; onChange: () => void }) {
  const desk = useIsDesk();
  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      {!desk && <PlacesMap preview places={[{ id: 0, title: address.name, count: 0, lat: address.lat, lng: address.lng }]} className="h-32" />}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem]">{address.name}</span>
          {address.address && <span className="block truncate text-xs text-muted">{address.address}</span>}
        </span>
        <button type="button" onClick={onChange} className="text-[0.8125rem] text-accent hover:underline">
          Change
        </button>
      </div>
    </div>
  );
}
