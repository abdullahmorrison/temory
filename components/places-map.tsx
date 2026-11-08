"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibre, Marker } from "maplibre-gl";
import { Info } from "lucide-react";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { locateHomeArea, rememberHomeArea, savedHomeArea } from "@/lib/home-area";
import { cityPoints } from "@/lib/map-frame";

// OpenFreeMap: free, no key, no limits. Its style carries the credit the map has to show.
const STYLE = "https://tiles.openfreemap.org/styles/positron";
const CLOSE_ZOOM = 14;
const CITY_ZOOM = 11;

export type MapPlace = { id: number; title: string; count: number; lat: number; lng: number };
/** `locate` centres the map on you, asking where you are if the browser hasn't been told yet. */
export type PlacesMapHandle = { locate: () => void };

type Props = {
  places: MapPlace[];
  selectedId?: number;
  onSelect?: (id: number) => void;
  /** A small map that only shows where a place is: no panning, no labels. */
  preview?: boolean;
  /** Change it to frame the city again, as when coming back from a place form. */
  frameKey?: number;
  /** An address picked but not saved yet, shown as a plain pin and centred on. */
  draft?: { title: string; lat: number; lng: number } | null;
  /** A tap on the map itself, not a pin. */
  onBackground?: () => void;
  /** Room kept clear of the map's edges, like a sheet over its bottom, when centring on a place. */
  padding?: { top?: number; bottom?: number };
  /** Off when the page shows the map's credit itself (phones, as <MapCredit>). */
  credit?: boolean;
  className?: string;
  ref?: Ref<PlacesMapHandle>;
};

/** The map's credit as an ⓘ that opens it, for pages that place it themselves. */
export function MapCredit({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Map credits"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-muted shadow-(--shadow-avatar) transition-colors hover:border-muted"
      >
        <Info size="1.125rem" />
      </button>
      {open && (
        <p className="rounded-xl bg-paper px-3 py-2 text-[0.6875rem] text-muted shadow-(--shadow-avatar) [&_a]:underline-offset-2 [&_a]:hover:underline">
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a>{" "}
          Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
        </p>
      )}
    </div>
  );
}

/** A map of places as numbered pins (how many people go there), the selected one in the accent colour. */
export function PlacesMap({ places, selectedId, frameKey = 0, draft, onSelect, onBackground, preview, padding, credit = true, className = "", ref }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibre>();
  const markers = useRef<Marker[]>([]);
  const youMarker = useRef<Marker>(undefined);
  const draftMarker = useRef<Marker>(undefined);
  const framed = useRef<string>(undefined);
  const background = useRef(onBackground);
  useEffect(() => {
    background.current = onBackground;
  });

  // MapLibre needs the browser, so it loads on the client after the first render.
  useEffect(() => {
    let live: MapLibre | undefined;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibre }) => {
      if (cancelled || !box.current) return;
      live = new maplibre.Map({
        container: box.current,
        style: STYLE,
        center: [0, 20],
        zoom: 1.5,
        interactive: !preview,
        attributionControl: false,
      });
      if (!preview && credit) live.addControl(new maplibre.AttributionControl({ compact: false }), "bottom-right");
      live.on("load", () => setMap(live));
      live.on("click", () => background.current?.());
    });
    // Next keeps a page you leave alive and runs this again when you come back, so the new map starts
    // fresh: framed again, with its own markers.
    return () => {
      cancelled = true;
      live?.remove();
      setMap(undefined);
      markers.current = [];
      youMarker.current = undefined;
      draftMarker.current = undefined;
      framed.current = undefined;
    };
  }, [preview, credit]);

  // You, as a blue dot: shown once the browser may say where you are, and followed as you move.
  const [you, setYou] = useState<{ lat: number; lng: number }>();
  const watching = useRef<number>(undefined);
  const flyToYou = useRef(false);
  const watch = () => {
    if (watching.current !== undefined || !("geolocation" in navigator)) return;
    watching.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setYou({ lat: coords.latitude, lng: coords.longitude });
        rememberHomeArea(coords.latitude, coords.longitude); // keeps search ranked near you after a move
      },
      () => {
        // Some errors leave the browser still watching, so stop it before a later tap starts another.
        navigator.geolocation.clearWatch(watching.current!);
        watching.current = undefined;
        flyToYou.current = false;
      },
      { enableHighAccuracy: true },
    );
  };
  useEffect(() => {
    if (preview) return;
    navigator.permissions?.query({ name: "geolocation" }).then((status) => status.state === "granted" && watch(), () => {});
    return () => {
      if (watching.current !== undefined) navigator.geolocation.clearWatch(watching.current);
      watching.current = undefined;
    };
  }, [preview]);
  useImperativeHandle(ref, () => ({
    locate() {
      if (you && map) map.easeTo({ center: [you.lng, you.lat], zoom: Math.max(map.getZoom(), CLOSE_ZOOM - 1), padding: edges(padding) });
      else {
        flyToYou.current = true;
        watch();
      }
    },
  }));
  useEffect(() => {
    if (!map || !you) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibre }) => {
      if (cancelled) return;
      youMarker.current ??= new maplibre.Marker({ element: youDot() }).setLngLat([you.lng, you.lat]).addTo(map);
      youMarker.current.setLngLat([you.lng, you.lat]);
      if (flyToYou.current) {
        flyToYou.current = false;
        map.easeTo({ center: [you.lng, you.lat], zoom: Math.max(map.getZoom(), CLOSE_ZOOM - 1), padding: edges(padding) });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [map, you, padding]);

  // Pins, redrawn whenever the places or the selection change.
  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibre }) => {
      if (cancelled) return;
      markers.current.forEach((m) => m.remove());
      markers.current = places.map((p) =>
        // A pin's dot sits on the spot, its name below.
        new maplibre.Marker({ element: pin(p, p.id === selectedId, preview, onSelect), anchor: preview ? "bottom" : "top", offset: preview ? [0, 0] : [0, -14] }).setLngLat([p.lng, p.lat]).addTo(map),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [map, places, selectedId, preview, onSelect]);

  // No places yet: open on your city, asking where you are the first time.
  useEffect(() => {
    if (!map || places.length || preview) return;
    const saved = savedHomeArea();
    if (saved) return void map.jumpTo({ center: [saved.lng, saved.lat], zoom: CITY_ZOOM });
    let cancelled = false;
    locateHomeArea().then((area) => {
      if (area && !cancelled) map.easeTo({ center: [area.lng, area.lat], zoom: CITY_ZOOM });
    });
    return () => {
      cancelled = true;
    };
  }, [map, places.length, preview]);

  useEffect(() => {
    if (!map) return;
    let cancelled = false;
    import("maplibre-gl").then(({ default: maplibre }) => {
      if (cancelled) return;
      draftMarker.current?.remove();
      draftMarker.current = undefined;
      if (!draft) return;
      draftMarker.current = new maplibre.Marker({ element: pin({ id: 0, title: draft.title, count: 0, lat: draft.lat, lng: draft.lng }, true, true), anchor: "bottom" })
        .setLngLat([draft.lng, draft.lat])
        .addTo(map);
      map.easeTo({ center: [draft.lng, draft.lat], zoom: Math.max(map.getZoom(), CLOSE_ZOOM) });
    });
    return () => {
      cancelled = true;
    };
  }, [map, draft]);

  // Frame the city your places are in, leaving out far-off ones. Again whenever a place is added or
  // removed or `frameKey` changes, unless one is selected; otherwise the map only follows the selection.
  const placeIds = `${places.map((p) => p.id).join()}|${frameKey}`;
  useEffect(() => {
    if (!map || !places.length || framed.current === placeIds) return;
    const first = framed.current === undefined;
    framed.current = placeIds;
    if (!first && selectedId) return;
    const pad = { top: 120 + (padding?.top ?? 0), bottom: 60 + (padding?.bottom ?? 0), left: 60, right: 60 };
    const city = cityPoints(places);
    if (city.length === 1 || preview) map.jumpTo({ center: [city[0].lng, city[0].lat], zoom: preview ? 15 : CLOSE_ZOOM });
    else map.fitBounds(bounds(city), { padding: pad, maxZoom: CLOSE_ZOOM, duration: first ? 0 : 600 });
  }, [map, places, placeIds, selectedId, preview, padding]);

  useEffect(() => {
    const place = places.find((p) => p.id === selectedId);
    if (!map || !place || preview) return;
    map.easeTo({ center: [place.lng, place.lat], zoom: Math.max(map.getZoom(), CLOSE_ZOOM - 1), padding: edges(padding) });
  }, [map, places, selectedId, preview, padding]);

  return <div ref={box} className={`bg-surface ${className}`} />;
}

const edges = (padding?: { top?: number; bottom?: number }) => ({ top: padding?.top ?? 0, bottom: padding?.bottom ?? 0, left: 0, right: 0 });

/** The usual blue "you are here" dot with a soft halo, under the pins. */
function youDot() {
  const el = document.createElement("div");
  el.className = "pointer-events-none relative size-9";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `<span class="absolute inset-0 rounded-full bg-[#1d7ee8]/20"></span><span class="absolute inset-2.5 rounded-full border-[2.5px] border-white bg-[#1d7ee8] shadow-sm"></span>`;
  return el;
}

function bounds(places: MapPlace[]): [[number, number], [number, number]] {
  const lngs = places.map((p) => p.lng);
  const lats = places.map((p) => p.lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/** A dot with the number of people and the place's name under it, or a plain pin for a preview. */
function pin(place: MapPlace, selected: boolean, preview?: boolean, onSelect?: (id: number) => void) {
  if (preview) {
    const el = document.createElement("div");
    el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" fill="var(--color-accent)" stroke="var(--color-paper)" stroke-width="1.5"/><circle cx="12" cy="10" r="3" fill="var(--color-paper)"/></svg>`;
    return el;
  }
  const el = document.createElement("button");
  el.type = "button";
  el.setAttribute("aria-label", `${place.title}, ${place.count} ${place.count === 1 ? "person" : "people"}`);
  el.setAttribute("aria-pressed", String(selected));
  el.className = `flex cursor-pointer flex-col items-center gap-1 ${selected ? "z-10" : "z-1"}`; // above your blue dot
  const dot = document.createElement("span");
  dot.className = `flex size-7 items-center justify-center rounded-full border-2 border-paper text-xs font-medium text-paper shadow-(--shadow-avatar) ${selected ? "bg-accent" : "bg-ink"}`;
  dot.textContent = String(place.count);
  const label = document.createElement("span");
  label.className = "max-w-32 truncate rounded-md bg-paper/90 px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink";
  label.textContent = place.title;
  el.append(dot, label);
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect?.(place.id);
  });
  return el;
}
