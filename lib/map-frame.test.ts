import { describe, expect, it } from "vitest";
import { cityPoints, distanceKm } from "./map-frame";

const toronto = [
  { id: 1, lat: 43.65, lng: -79.38 },
  { id: 2, lat: 43.67, lng: -79.4 },
  { id: 3, lat: 43.7, lng: -79.42 },
];

describe("distanceKm", () => {
  it("is about right across a city", () => {
    expect(distanceKm({ lat: 43.65, lng: -79.38 }, { lat: 43.75, lng: -79.38 })).toBeCloseTo(11.1, 0);
  });
});

describe("cityPoints", () => {
  it("leaves out places far from where most of them are", () => {
    const withTrips = [...toronto, { id: 4, lat: 45.5, lng: -73.57 }, { id: 5, lat: 44.6, lng: -79.9 }];
    expect(cityPoints(withTrips).map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("keeps everything when there are too few to tell, or all are spread out", () => {
    expect(cityPoints(toronto.slice(0, 2))).toHaveLength(2);
    const spread = [
      { lat: 43.65, lng: -79.38 },
      { lat: 45.5, lng: -73.57 },
      { lat: 49.28, lng: -123.12 },
    ];
    expect(cityPoints(spread)).toHaveLength(3);
  });
});
