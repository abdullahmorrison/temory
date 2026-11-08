// Roughly where you are, kept on this device, so an empty map opens on your city and address search
// prefers results near it. Rounded to about a kilometre: a city, not a doorstep.

import { distanceKm } from "@/lib/map-frame";

export type HomeArea = { lat: number; lng: number };

const KEY = "temory:home-area";
const round = (n: number) => Math.round(n * 100) / 100;
// Moving less than this isn't a new city, so the saved area is left alone.
const MOVED_KM = 5;

/** The area saved on this device, if any. Storage can be blocked, so this never throws. */
export function savedHomeArea(): HomeArea | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return typeof saved?.lat === "number" && typeof saved?.lng === "number" ? saved : null;
  } catch {
    return null;
  }
}

/** Saves where you are, but only when it's a different area from the one saved, so a live position can call this freely. */
export function rememberHomeArea(lat: number, lng: number) {
  const saved = savedHomeArea();
  if (saved && distanceKm(saved, { lat, lng }) < MOVED_KM) return saved;
  const area = { lat: round(lat), lng: round(lng) };
  try {
    localStorage.setItem(KEY, JSON.stringify(area));
  } catch {}
  return area;
}

/** Asks the browser where you are (it may ask you first) and saves it; null if refused or unavailable. */
export function locateHomeArea(): Promise<HomeArea | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve(rememberHomeArea(coords.latitude, coords.longitude)),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 24 * 60 * 60 * 1000 },
    );
  });
}
