import { describe, expect, it } from "vitest";
import { openDb } from "./db";
import { createPerson, deletePerson } from "./people";
import { createPlace, deletePlace, getPlace, listPlaces, placeTitle, updatePlace } from "./places";

const park = { name: "Cal Anderson Park", address: "1635 11th Ave, Seattle", area: "Capitol Hill", lat: 47.617, lng: -122.319 };

describe("createPlace", () => {
  it("trims what's typed and keeps who goes there, closest first", () => {
    const db = openDb(":memory:");
    const sam = createPerson(db, { name: "Sam", closeness: 3 });
    const priya = createPerson(db, { name: "Priya", closeness: 1 });
    const p = createPlace(db, { ...park, alias: "  The park ", personIds: [sam.id, priya.id, sam.id] });
    expect(p).toMatchObject({ name: "Cal Anderson Park", alias: "The park", area: "Capitol Hill" });
    expect(getPlace(db, p.id)?.people.map((x) => x.name)).toEqual(["Priya", "Sam"]);
  });

  it("needs a picked address with a location, and people who exist", () => {
    const db = openDb(":memory:");
    expect(() => createPlace(db, { ...park, name: " " })).toThrow("Pick an address");
    expect(() => createPlace(db, { ...park, lat: Number.NaN })).toThrow("no location");
    expect(() => createPlace(db, { ...park, personIds: [999] })).toThrow("no longer exists");
  });
});

describe("updatePlace", () => {
  it("replaces the address, alias and people", () => {
    const db = openDb(":memory:");
    const sam = createPerson(db, { name: "Sam" });
    const p = createPlace(db, { ...park, personIds: [sam.id] });
    updatePlace(db, p.id, { ...park, name: "Volunteer Park", alias: "", personIds: [] });
    expect(getPlace(db, p.id)).toMatchObject({ name: "Volunteer Park", alias: "", people: [] });
    expect(() => updatePlace(db, 999, park)).toThrow("no longer exists");
  });
});

describe("listPlaces", () => {
  it("puts places with the most people first, then A to Z by what they're called", () => {
    const db = openDb(":memory:");
    const sam = createPerson(db, { name: "Sam" });
    createPlace(db, { ...park, name: "Zoo" });
    createPlace(db, { ...park, name: "Library", alias: "Books" });
    createPlace(db, { ...park, name: "Gym", personIds: [sam.id] });
    expect(listPlaces(db).map(placeTitle)).toEqual(["Gym", "Books", "Zoo"]);
  });

  it("drops a deleted person from their places, and a deleted place keeps its people", () => {
    const db = openDb(":memory:");
    const sam = createPerson(db, { name: "Sam" });
    const p = createPlace(db, { ...park, personIds: [sam.id] });
    deletePerson(db, sam.id);
    expect(getPlace(db, p.id)?.people).toEqual([]);
    deletePlace(db, p.id);
    expect(listPlaces(db)).toEqual([]);
  });
});
