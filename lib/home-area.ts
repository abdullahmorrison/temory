// Roughly where you are, kept on this device, so an empty map opens on your city and address search
// prefers results near it. Rounded to about a kilometre: a city, not a doorstep.

export type HomeArea = { lat: number; lng: number };

const KEY = "temory:home-area";
const round = (n: number) => Math.round(n * 100) / 100;

/** The area saved on this device, if any. Storage can be blocked, so this never throws. */
export function savedHomeArea(): HomeArea | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return typeof saved?.lat === "number" && typeof saved?.lng === "number" ? saved : null;
  } catch {
    return null;
  }
}

/** Asks the browser where you are (it may ask you first) and saves it; null if refused or unavailable. */
export function locateHomeArea(): Promise<HomeArea | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const area = { lat: round(coords.latitude), lng: round(coords.longitude) };
        try {
          localStorage.setItem(KEY, JSON.stringify(area));
        } catch {}
        resolve(area);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 24 * 60 * 60 * 1000 },
    );
  });
}
