// Address search with Photon (photon.komoot.io): free, no key, made for search-as-you-type, and built
// on OpenStreetMap. Its public server is fair use, so callers wait for a pause in typing.

import type { HomeArea } from "@/lib/home-area";
import { distanceKm } from "@/lib/map-frame";

export type AddressResult = { name: string; address: string; area: string; lat: number; lng: number };

type Feature = {
  geometry: { coordinates: [number, number] };
  properties: Partial<Record<"name" | "housenumber" | "street" | "district" | "locality" | "city" | "county" | "state" | "country", string>>;
};

/** One search result as a place: its own name, a one-line address, and its neighbourhood or city. */
export function toResult({ geometry, properties: p }: Feature): AddressResult {
  const street = [p.housenumber, p.street].filter(Boolean).join(" ");
  const name = p.name || street || p.city || p.country || "";
  const parts = [street, p.district || p.locality, p.city, p.state].filter((part): part is string => !!part && part !== name);
  const [lng, lat] = geometry.coordinates;
  return { name, address: [...new Set(parts)].join(", "), area: p.district || p.locality || p.city || p.county || p.state || "", lat, lng };
}

/** Up to five places matching what was typed, those near `near` first. Without it, results are worldwide. */
export async function searchAddresses(query: string, near: HomeArea | null, signal?: AbortSignal): Promise<AddressResult[]> {
  // Photon weighs how notable a place is far above how near it is by default (0.2), so a big campus
  // across the lake beats the office down the street. 0.1 lets nearness count more.
  const url = `https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(query)}${near ? `&lat=${near.lat}&lon=${near.lng}&location_bias_scale=0.1` : ""}`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Address search isn't answering. Try again in a moment.");
  const { features } = (await response.json()) as { features: Feature[] };
  const results = features.map(toResult).filter((r) => r.name);
  return near ? nearestFirst(results, near) : results;
}

/**
 * Places with the same name, like several offices of one company, nearest first. Different names
 * keep Photon's order, which is about how well they match what was typed.
 */
export function nearestFirst(results: AddressResult[], near: HomeArea) {
  const firstSeen = new Map<string, number>();
  results.forEach((r, i) => firstSeen.set(r.name.toLowerCase(), firstSeen.get(r.name.toLowerCase()) ?? i));
  return [...results].sort(
    (a, b) => firstSeen.get(a.name.toLowerCase())! - firstSeen.get(b.name.toLowerCase())! || distanceKm(a, near) - distanceKm(b, near),
  );
}
