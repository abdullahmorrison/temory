import { describe, expect, it } from "vitest";
import { createActivity, deleteActivity, getActivity, listActivities, setActivityStatus, startDoing, updateActivity } from "./activities";
import { createMoment } from "./moments";
import { createPerson, deletePerson, getPerson } from "./people";
import { account } from "./test-account";

describe("createActivity", () => {
  it("trims the name and notes and keeps who it's with", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    const a = createActivity(my, { name: " Pickleball ", icon: "pickleball", notes: " Tuesdays ", personIds: [sam.id] });
    expect(a).toMatchObject({ name: "Pickleball", icon: "pickleball", notes: "Tuesdays" });
    expect(getActivity(my, a.id)?.people.map((p) => p.name)).toEqual(["Sam"]);
  });

  it("rejects a blank name or an unknown icon", () => {
    const my = account();
    expect(() => createActivity(my, { name: "  ", icon: "dices" })).toThrow("needs a name");
    expect(() => createActivity(my, { name: "Chess", icon: "not-an-icon" })).toThrow("Unknown icon");
  });

  it("fails clearly when someone added is gone", () => {
    const my = account();
    expect(() => createActivity(my, { name: "Chess", icon: "dices", personIds: [999] })).toThrow("no longer exists");
  });
});

describe("updateActivity", () => {
  it("replaces who it's with", () => {
    const my = account();
    const [sam, priya] = ["Sam", "Priya"].map((name) => createPerson(my, { name }));
    const a = createActivity(my, { name: "Hiking", icon: "mountain-snow", personIds: [sam.id] });
    updateActivity(my, a.id, { name: "Hiking", icon: "mountain-snow", personIds: [priya.id, priya.id] });
    expect(getActivity(my, a.id)?.people.map((p) => p.name)).toEqual(["Priya"]);
  });

  it("fails clearly when the activity is gone", () => {
    const my = account();
    expect(() => updateActivity(my, 999, { name: "Ghost", icon: "dices" })).toThrow("no longer exists");
  });
});

describe("listActivities", () => {
  it("puts those in the most moments first, then those with the most people, then A to Z, and counts them", () => {
    const my = account();
    const [sam, priya] = ["Sam", "Priya"].map((name) => createPerson(my, { name }));
    const add = (name: string, personIds: number[] = []) => createActivity(my, { name, icon: "dices", personIds });
    const pickleball = add("Pickleball", [sam.id]);
    const games = add("Board games", [sam.id, priya.id]);
    const climbing = add("Climbing");
    add("bowling");
    add("Chess", [priya.id]);
    const log = (...activityIds: number[]) => createMoment(my, { body: "Hi", date: "2026-10-01", personIds: [], activityIds });
    log(pickleball.id, games.id);
    log(pickleball.id);
    log(games.id);
    log(climbing.id);
    expect(listActivities(my).map((a) => [a.name, a.moments])).toEqual([
      ["Board games", 2],
      ["Pickleball", 2],
      ["Climbing", 1],
      ["Chess", 0],
      ["bowling", 0],
    ]);
  });

  it("lists people closest first", () => {
    const my = account();
    const far = createPerson(my, { name: "Aaron", closeness: 4 });
    const close = createPerson(my, { name: "Zoe", closeness: 1 });
    createActivity(my, { name: "Hiking", icon: "mountain-snow", personIds: [far.id, close.id] });
    expect(listActivities(my)[0].people.map((p) => p.name)).toEqual(["Zoe", "Aaron"]);
  });
});

describe("deleting", () => {
  it("an activity keeps its people", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    const a = createActivity(my, { name: "Hiking", icon: "mountain-snow", personIds: [sam.id] });
    deleteActivity(my, a.id);
    expect(getActivity(my, a.id)).toBeUndefined();
    expect(getPerson(my, sam.id)).toBeDefined();
  });

  it("a person takes them off their activities", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    const a = createActivity(my, { name: "Hiking", icon: "mountain-snow", personIds: [sam.id] });
    deletePerson(my, sam.id);
    expect(getActivity(my, a.id)?.people).toEqual([]);
  });
});

describe("activity status", () => {
  it("starts as Doing, and checks the status", () => {
    const my = account();
    expect(createActivity(my, { name: "Chess", icon: "dices" })).toMatchObject({ status: "doing" });
    expect(createActivity(my, { name: "Climbing", icon: "dices", status: "want" })).toMatchObject({ status: "want" });
    expect(() => createActivity(my, { name: "Golf", icon: "dices", status: "someday" })).toThrow("Unknown status");
  });

  it("lists Doing, then Want to, then Past", () => {
    const my = account();
    const past = createActivity(my, { name: "Rugby", icon: "dices", status: "past" });
    createActivity(my, { name: "Pottery", icon: "dices", status: "want" });
    createActivity(my, { name: "Chess", icon: "dices" });
    createMoment(my, { body: "Old match", date: "2026-01-01", time: "", personIds: [], activityIds: [past.id] });
    expect(listActivities(my).map((a) => a.name)).toEqual(["Chess", "Pottery", "Rugby"]);
  });

  it("moves between statuses, and only Want to activities start being done", () => {
    const my = account();
    const chess = createActivity(my, { name: "Chess", icon: "dices" });
    const pottery = createActivity(my, { name: "Pottery", icon: "dices", status: "want" });
    setActivityStatus(my, chess.id, "past");
    startDoing(my, [chess.id, pottery.id]);
    expect(getActivity(my, chess.id)?.status).toBe("past");
    expect(getActivity(my, pottery.id)?.status).toBe("doing");
    expect(() => setActivityStatus(my, 999, "doing")).toThrow("no longer exists");
    expect(() => setActivityStatus(my, chess.id, "later")).toThrow("Unknown status");
  });
});
