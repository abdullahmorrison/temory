import { describe, expect, it } from "vitest";
import { createActivity, deleteActivity, getActivity, listActivities, setActivityStatus, startDoing, updateActivity } from "./activities";
import { createMoment, deleteMoment, getMoment, listMoments, updateMoment } from "./moments";
import { createPerson, deletePerson, getPerson, listPeople, listTier, moveToTier, updatePerson } from "./people";
import { createPlace, deletePlace, getPlace, listPlaces, updatePlace } from "./places";
import { createType, deleteType, listTypes, updateType } from "./relationship-types";
import { account, otherAccount } from "./test-account";

// Two accounts in one database: neither can see, change, or link to the other's things.
function twoAccounts() {
  const mine = account();
  const theirs = otherAccount(mine);
  const sam = createPerson(mine, { name: "Sam" });
  const chess = createActivity(mine, { name: "Chess", icon: "dices", status: "want", personIds: [sam.id] });
  const park = createPlace(mine, { name: "Park", lat: 1, lng: 1, personIds: [sam.id] });
  const ramen = createMoment(mine, { body: "Ramen", date: "2026-10-20", personIds: [sam.id], activityIds: [chess.id] });
  const climbing = createType(mine, { name: "Climbing", emoji: "🧗" });
  return { mine, theirs, sam, chess, park, ramen, climbing };
}

describe("accounts", () => {
  it("see only their own things", () => {
    const { mine, theirs, sam, chess, park, ramen, climbing } = twoAccounts();
    expect(listPeople(theirs)).toEqual([]);
    expect(listTier(theirs, sam.closeness)).toEqual([]);
    expect(getPerson(theirs, sam.id)).toBeUndefined();
    expect(listActivities(theirs)).toEqual([]);
    expect(getActivity(theirs, chess.id)).toBeUndefined();
    expect(listPlaces(theirs)).toEqual([]);
    expect(getPlace(theirs, park.id)).toBeUndefined();
    expect(listMoments(theirs)).toEqual([]);
    expect(listMoments(theirs, { personId: sam.id })).toEqual([]);
    expect(getMoment(theirs, ramen.id)).toBeUndefined();
    expect(listTypes(theirs).map((t) => t.id)).not.toContain(climbing.id);
    expect(listTypes(theirs).length).toBe(listTypes(mine).length - 1); // the presets are everyone's
  });

  it("can't change or delete someone else's things", () => {
    const { mine, theirs, sam, chess, park, ramen, climbing } = twoAccounts();
    expect(() => updatePerson(theirs, sam.id, { name: "Stolen" })).toThrow("no longer exists");
    expect(() => moveToTier(theirs, sam.id, 1)).toThrow("no longer exists");
    expect(() => updateActivity(theirs, chess.id, { name: "Stolen", icon: "dices" })).toThrow("no longer exists");
    expect(() => setActivityStatus(theirs, chess.id, "past")).toThrow("no longer exists");
    startDoing(theirs, [chess.id]);
    expect(() => updatePlace(theirs, park.id, { name: "Stolen", lat: 1, lng: 1 })).toThrow("no longer exists");
    expect(() => updateMoment(theirs, ramen.id, { body: "Stolen", date: "2026-10-20", personIds: [] })).toThrow("no longer exists");
    expect(() => updateType(theirs, climbing.id, { name: "Stolen", emoji: "🧗" })).toThrow("no longer exists");
    expect(() => deleteType(theirs, climbing.id)).toThrow("no longer exists");
    deletePerson(theirs, sam.id);
    deleteActivity(theirs, chess.id);
    deletePlace(theirs, park.id);
    deleteMoment(theirs, ramen.id);

    expect(getPerson(mine, sam.id)).toMatchObject({ name: "Sam" });
    expect(getActivity(mine, chess.id)).toMatchObject({ name: "Chess", status: "want" });
    expect(getPlace(mine, park.id)).toMatchObject({ name: "Park" });
    expect(getMoment(mine, ramen.id)).toMatchObject({ body: "Ramen" });
    expect(listTypes(mine).find((t) => t.id === climbing.id)).toMatchObject({ name: "Climbing" });
  });

  it("can't link their things to someone else's", () => {
    const { theirs, sam, chess, climbing } = twoAccounts();
    expect(() => createMoment(theirs, { body: "Hi", date: "2026-10-20", personIds: [sam.id] })).toThrow("no longer exists");
    expect(() => createMoment(theirs, { body: "Hi", date: "2026-10-20", personIds: [], activityIds: [chess.id] })).toThrow("no longer exists");
    expect(() => createActivity(theirs, { name: "Go", icon: "dices", personIds: [sam.id] })).toThrow("no longer exists");
    expect(() => createPlace(theirs, { name: "Cafe", lat: 1, lng: 1, personIds: [sam.id] })).toThrow("no longer exists");
    expect(() => createPerson(theirs, { name: "Lee", typeId: climbing.id })).toThrow("no longer exists");
  });

  it("keep their own type names apart, so two people can both have a Climbing type", () => {
    const { theirs } = twoAccounts();
    expect(createType(theirs, { name: "Climbing", emoji: "🧗" })).toMatchObject({ name: "Climbing" });
  });
});
