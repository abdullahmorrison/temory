import { describe, expect, it } from "vitest";
import { nearestFirst, toResult } from "./photon";

const at = (properties: object) => ({ geometry: { coordinates: [-122.319, 47.617] as [number, number] }, properties });

describe("toResult", () => {
  it("names a place and builds its address without repeating the name", () => {
    const r = toResult(at({ name: "Cal Anderson Park", housenumber: "1635", street: "11th Ave", district: "Capitol Hill", city: "Seattle", state: "Washington" }));
    expect(r).toEqual({ name: "Cal Anderson Park", address: "1635 11th Ave, Capitol Hill, Seattle, Washington", area: "Capitol Hill", lat: 47.617, lng: -122.319 });
  });

  it("uses the street as the name of a plain address", () => {
    const r = toResult(at({ housenumber: "12", street: "Pine St", city: "Seattle" }));
    expect(r).toMatchObject({ name: "12 Pine St", address: "Seattle", area: "Seattle" });
  });

  it("names a city by itself", () => {
    expect(toResult(at({ name: "Toronto", city: "Toronto", state: "Ontario" }))).toMatchObject({ name: "Toronto", address: "Ontario", area: "Toronto" });
  });
});

describe("nearestFirst", () => {
  const office = (address: string, lat: number, lng: number) => ({ name: "Google", address, area: "", lat, lng });
  it("puts the nearest of same-named places first and leaves other names where they were", () => {
    const belltown = { lat: 47.61, lng: -122.35 };
    const kirkland = office("Kirkland", 47.67, -122.2);
    const slu = office("Fairview Ave N", 47.62, -122.33);
    const cafe = { name: "Googie's", address: "", area: "", lat: 47.61, lng: -122.35 };
    expect(nearestFirst([kirkland, cafe, slu], belltown)).toEqual([slu, kirkland, cafe]);
  });
});
