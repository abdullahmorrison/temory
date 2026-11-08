// Which places the Places map frames: the city you meet people in, not every far-off spot.

type Point = { lat: number; lng: number };

// Places further than this from the middle of the rest are left out of the frame (still on the map).
// About a metro area; a trip or a cottage is further.
export const CITY_RADIUS_KM = 50;

/** Straight-line distance, close enough at city scale. */
export function distanceKm(a: Point, b: Point) {
  const x = (b.lng - a.lng) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180));
  return Math.hypot(x, b.lat - a.lat) * 111.32;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length / 2;
  return Number.isInteger(mid) ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[Math.floor(mid)];
};

/**
 * The places within a city's reach of where most of them are. The middle is the median, so a few
 * places far away can't drag it off. If none are near it, which only happens with no clear city, all
 * places are kept.
 */
export function cityPoints<T extends Point>(points: T[], radiusKm = CITY_RADIUS_KM): T[] {
  if (points.length <= 2) return points;
  const centre = { lat: median(points.map((p) => p.lat)), lng: median(points.map((p) => p.lng)) };
  const near = points.filter((p) => distanceKm(p, centre) <= radiusKm);
  return near.length ? near : points;
}
