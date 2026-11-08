import { and, asc, eq, inArray } from "drizzle-orm";
import { people, personPlaces, places, relationshipTypes } from "@/db/schema";
import type { Db, UserDb } from "@/lib/db";
import { cityPoints } from "@/lib/map-frame";
import { personEmoji, withType } from "@/lib/people";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** What the address search found, plus what you call it and who goes there. */
export type PlaceInput = { name: string; address?: string; area?: string; lat: number; lng: number; alias?: string; personIds?: number[] };

export type PlacePerson = { id: number; name: string; color: number; emoji: string; closeness: number };
export type Place = { id: number; title: string; name: string; alias: string; address: string; area: string; lat: number; lng: number; people: PlacePerson[] };

/** What a place is called on screen: your name for it, or its own. */
export function placeTitle(place: { name: string; alias: string }) {
  return place.alias || place.name;
}

/** Trims and checks the input; throws a message fit to show the user. */
function clean({ db, userId }: UserDb, input: PlaceInput) {
  const name = input.name.trim();
  if (!name) throw new Error("Pick an address from the search.");
  if (!(Math.abs(input.lat) <= 90 && Math.abs(input.lng) <= 180)) throw new Error("That address has no location. Pick another.");
  const personIds = [...new Set(input.personIds ?? [])];
  if (personIds.length) {
    const found = db.select({ id: people.id }).from(people).where(and(eq(people.userId, userId), inArray(people.id, personIds))).all();
    if (found.length !== personIds.length) throw new Error("Someone you added no longer exists.");
  }
  const values = {
    name,
    alias: (input.alias ?? "").trim(),
    address: (input.address ?? "").trim(),
    area: (input.area ?? "").trim(),
    lat: input.lat,
    lng: input.lng,
  };
  return { values, personIds };
}

function setPeople(db: Tx, placeId: number, personIds: number[]) {
  db.delete(personPlaces).where(eq(personPlaces.placeId, placeId)).run();
  if (personIds.length) db.insert(personPlaces).values(personIds.map((personId) => ({ placeId, personId }))).run();
}

/** One of your places, by id. */
const yourPlace = (userId: number, id: number) => and(eq(places.id, id), eq(places.userId, userId));

export function createPlace(my: UserDb, input: PlaceInput) {
  const { values, personIds } = clean(my, input);
  return my.db.transaction((tx) => {
    const created = tx
      .insert(places)
      .values({ ...values, userId: my.userId })
      .returning()
      .get();
    setPeople(tx, created.id, personIds);
    return created;
  });
}

/** Changes the address, what you call it, and who goes there. */
export function updatePlace(my: UserDb, id: number, input: PlaceInput) {
  const { values, personIds } = clean(my, input);
  return my.db.transaction((tx) => {
    const updated = tx.update(places).set(values).where(yourPlace(my.userId, id)).returning().get();
    if (!updated) throw new Error("This place no longer exists.");
    setPeople(tx, id, personIds);
    return updated;
  });
}

/** Removes the place. The people stay. */
export function deletePlace({ db, userId }: UserDb, id: number) {
  db.delete(places).where(yourPlace(userId, id)).run();
}

/** Every place with who goes there, closest first; places with the most people first, then A to Z. */
export function listPlaces({ db, userId }: UserDb): Place[] {
  const rows = db
    .select({ placeId: personPlaces.placeId, id: people.id, name: people.name, color: people.color, emoji: personEmoji, closeness: people.closeness })
    .from(personPlaces)
    .innerJoin(people, eq(people.id, personPlaces.personId))
    .leftJoin(relationshipTypes, withType)
    .where(eq(people.userId, userId))
    .orderBy(asc(people.closeness), asc(people.name))
    .all();
  const byPlace = new Map<number, PlacePerson[]>();
  for (const { placeId, ...person } of rows) byPlace.set(placeId, [...(byPlace.get(placeId) ?? []), person]);
  return db
    .select({ id: places.id, name: places.name, alias: places.alias, address: places.address, area: places.area, lat: places.lat, lng: places.lng })
    .from(places)
    .where(eq(places.userId, userId))
    .all()
    .map((p) => ({ ...p, title: placeTitle(p), people: byPlace.get(p.id) ?? [] }))
    .sort((a, b) => b.people.length - a.people.length || a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

export function getPlace(my: UserDb, id: number) {
  return listPlaces(my).find((p) => p.id === id);
}

/** The middle of your places in your city, to rank address search near them; undefined with none. */
export function placesCentre(all: { lat: number; lng: number }[]) {
  if (!all.length) return undefined;
  const list = cityPoints(all); // a far-off place would pull the middle out of town
  const sum = list.reduce((a, p) => ({ lat: a.lat + p.lat, lng: a.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / list.length, lng: sum.lng / list.length };
}
