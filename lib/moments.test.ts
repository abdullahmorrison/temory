import { describe, expect, it } from "vitest";
import { entryActivities, entryPeople } from "@/db/schema";
import { createActivity, deleteActivity } from "./activities";
import { createMoment, deleteMoment, formDefaults, getMoment, groupByDay, groupByMonth, listMoments, updateMoment } from "./moments";
import { createPerson, deletePerson } from "./people";
import { account } from "./test-account";

function setup() {
  const my = account();
  const sam = createPerson(my, { name: "Sam Rivera" });
  const priya = createPerson(my, { name: "Priya Shah" });
  return { my, sam, priya };
}

describe("createMoment", () => {
  it("saves the text, date, and people", () => {
    const { my, sam, priya } = setup();
    const m = createMoment(my, { body: "  Ramen on 5th.  ", date: "2026-10-20", personIds: [sam.id, priya.id, sam.id] });
    expect(getMoment(my, m.id)).toMatchObject({
      body: "Ramen on 5th.",
      date: "2026-10-20",
      people: [
        { id: priya.id, name: "Priya Shah" },
        { id: sam.id, name: "Sam Rivera" },
      ],
    });
  });

  it("allows a solo moment", () => {
    const { my } = setup();
    const m = createMoment(my, { body: "Rough day.", date: "2026-10-22", personIds: [] });
    expect(getMoment(my, m.id)?.people).toEqual([]);
  });

  it("rejects empty text, bad dates, and unknown people", () => {
    const { my } = setup();
    expect(() => createMoment(my, { body: "  ", date: "2026-10-22", personIds: [] })).toThrow("Write something");
    expect(() => createMoment(my, { body: "Hi", date: "2026-02-30", personIds: [] })).toThrow("Pick a date");
    expect(() => createMoment(my, { body: "Hi", date: "2026-10-22", personIds: [999] })).toThrow("no longer exists");
    expect(listMoments(my)).toHaveLength(0);
  });
});

describe("time", () => {
  it("is kept when given and empty when not, and rejects a bad one", () => {
    const { my } = setup();
    const timed = createMoment(my, { body: "Ramen", date: "2026-10-20", time: "19:15", personIds: [] });
    const untimed = createMoment(my, { body: "Lunch", date: "2026-10-20", time: "", personIds: [] });
    expect(getMoment(my, timed.id)).toMatchObject({ time: "19:15" });
    expect(formDefaults(getMoment(my, untimed.id))).toMatchObject({ time: "" });
    expect(() => createMoment(my, { body: "Hi", date: "2026-10-20", time: "25:00", personIds: [] })).toThrow("Pick a time");
  });

  it("orders a day by time, latest first, with untimed moments after", () => {
    const { my } = setup();
    createMoment(my, { body: "No time", date: "2026-10-22", personIds: [] });
    createMoment(my, { body: "Noon", date: "2026-10-22", time: "12:30", personIds: [] });
    createMoment(my, { body: "Night", date: "2026-10-22", time: "21:40", personIds: [] });
    createMoment(my, { body: "Yesterday", date: "2026-10-21", time: "23:00", personIds: [] });
    expect(listMoments(my).map((m) => m.body)).toEqual(["Night", "Noon", "No time", "Yesterday"]);
  });
});

describe("activities", () => {
  it("saves what a moment was spent doing, and what its text names", () => {
    const { my } = setup();
    const hiking = createActivity(my, { name: "Hiking", icon: "mountain" });
    const games = createActivity(my, { name: "Board games", icon: "dices" });
    const m = createMoment(my, {
      body: "/[Board games](activity:" + games.id + ") all night",
      date: "2026-10-22",
      personIds: [],
      activityIds: [hiking.id, games.id, games.id],
      activityViaMention: [games.id, 999],
    });
    const saved = getMoment(my, m.id)!;
    expect(saved.activities).toEqual([
      { id: games.id, name: "Board games", icon: "dices", viaMention: true },
      { id: hiking.id, name: "Hiking", icon: "mountain", viaMention: false },
    ]);
    expect(saved.mentionedActivities).toEqual([{ id: games.id, name: "Board games" }]);
    expect(formDefaults(saved)).toMatchObject({ activityIds: [games.id, hiking.id], activityViaMention: [games.id] });
  });

  it("narrows to one activity's moments, newest first", () => {
    const { my } = setup();
    const hiking = createActivity(my, { name: "Hiking", icon: "mountain" });
    const games = createActivity(my, { name: "Board games", icon: "dices" });
    createMoment(my, { body: "Hike", date: "2026-10-01", personIds: [], activityIds: [hiking.id] });
    createMoment(my, { body: "Both", date: "2026-10-20", personIds: [], activityIds: [hiking.id, games.id] });
    createMoment(my, { body: "Neither", date: "2026-10-22", personIds: [] });
    expect(listMoments(my, { activityId: hiking.id }).map((m) => m.body)).toEqual(["Both", "Hike"]);
    expect(listMoments(my, { activityId: games.id }).map((m) => m.body)).toEqual(["Both"]);
  });

  it("rejects unknown activities, replaces them on edit, and drops deleted ones", () => {
    const { my } = setup();
    const hiking = createActivity(my, { name: "Hiking", icon: "mountain" });
    const games = createActivity(my, { name: "Board games", icon: "dices" });
    expect(() => createMoment(my, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [999] })).toThrow("no longer exists");
    const m = createMoment(my, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [hiking.id] });
    updateMoment(my, m.id, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [games.id] });
    expect(getMoment(my, m.id)?.activities.map((a) => a.id)).toEqual([games.id]);
    deleteActivity(my, games.id);
    expect(getMoment(my, m.id)?.activities).toEqual([]);
    deleteMoment(my, m.id);
    expect(my.db.select().from(entryActivities).all()).toHaveLength(0);
  });
});

describe("updateMoment", () => {
  it("replaces the text, date, and people", () => {
    const { my, sam, priya } = setup();
    const m = createMoment(my, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    updateMoment(my, m.id, { body: "Ramen with Priya", date: "2026-10-21", personIds: [priya.id] });
    expect(getMoment(my, m.id)).toMatchObject({ body: "Ramen with Priya", date: "2026-10-21", people: [{ id: priya.id }] });
  });

  it("leaves the moment as it was when an edit is rejected", () => {
    const { my, sam } = setup();
    const m = createMoment(my, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    expect(() => updateMoment(my, m.id, { body: "  ", date: "2026-10-21", personIds: [] })).toThrow("Write something");
    expect(() => updateMoment(my, m.id, { body: "Ramen", date: "2026-10-21", personIds: [999] })).toThrow("no longer exists");
    expect(getMoment(my, m.id)).toMatchObject({ body: "Ramen", date: "2026-10-20", people: [{ id: sam.id }] });
  });

  it("fails clearly when the moment is gone", () => {
    const { my } = setup();
    expect(() => updateMoment(my, 999, { body: "Hi", date: "2026-10-22", personIds: [] })).toThrow("no longer exists");
  });
});

describe("deleteMoment", () => {
  it("removes the moment and its links", () => {
    const { my, sam } = setup();
    const m = createMoment(my, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    deleteMoment(my, m.id);
    expect(getMoment(my, m.id)).toBeUndefined();
    expect(my.db.select().from(entryPeople).all()).toHaveLength(0);
  });
});

describe("listMoments", () => {
  it("lists newest first, and a deleted person drops out of their moments", () => {
    const { my, sam } = setup();
    createMoment(my, { body: "Older", date: "2026-09-14", personIds: [sam.id] });
    createMoment(my, { body: "Newer", date: "2026-10-20", personIds: [sam.id] });
    createMoment(my, { body: "Same day, later", date: "2026-10-20", personIds: [] });
    expect(listMoments(my).map((m) => m.body)).toEqual(["Same day, later", "Newer", "Older"]);
    deletePerson(my, sam.id);
    expect(listMoments(my).every((m) => m.people.length === 0)).toBe(true);
  });

  it("narrows to one person's moments, still listing everyone in them", () => {
    const { my, sam, priya } = setup();
    createMoment(my, { body: "Both", date: "2026-10-20", personIds: [sam.id, priya.id] });
    createMoment(my, { body: "Just Priya", date: "2026-10-21", personIds: [priya.id] });
    createMoment(my, { body: "Solo", date: "2026-10-22", personIds: [] });
    const sams = listMoments(my, { personId: sam.id });
    expect(sams.map((m) => m.body)).toEqual(["Both"]);
    expect(sams[0].people.map((p) => p.id)).toEqual([priya.id, sam.id]);
    expect(listMoments(my, { personId: priya.id }).map((m) => m.body)).toEqual(["Just Priya", "Both"]);
  });
});

describe("people there only because of a mention", () => {
  it("are stored as such, while everyone else is kept, and an edit can lock them in", () => {
    const { my, sam, priya } = setup();
    const body = "Ramen with @[Sam Rivera](person:" + sam.id + ")";
    const m = createMoment(my, { body, date: "2026-10-20", personIds: [sam.id, priya.id], viaMention: [sam.id] });
    expect(getMoment(my, m.id).people).toMatchObject([
      { id: priya.id, viaMention: false },
      { id: sam.id, viaMention: true },
    ]);
    updateMoment(my, m.id, { body, date: "2026-10-20", personIds: [sam.id, priya.id] });
    expect(getMoment(my, m.id).people.every((p) => !p.viaMention)).toBe(true);
  });

  it("ignores a mention flag for someone not in the moment", () => {
    const { my, sam, priya } = setup();
    const m = createMoment(my, { body: "Hi", date: "2026-10-20", personIds: [priya.id], viaMention: [sam.id] });
    expect(getMoment(my, m.id).people).toMatchObject([{ id: priya.id, viaMention: false }]);
  });
});

describe("mentioned", () => {
  it("lists everyone the text mentions, in the moment or not, and skips deleted people", () => {
    const { my, sam, priya } = setup();
    const gone = createPerson(my, { name: "Omar Farouk" });
    const body = `@[Sam Rivera](person:${sam.id}) and @[Priya Shah](person:${priya.id}) and @[Omar Farouk](person:${gone.id})`;
    const m = createMoment(my, { body, date: "2026-10-20", personIds: [sam.id] });
    deletePerson(my, gone.id);
    expect(getMoment(my, m.id).mentioned.map((p) => p.id).sort()).toEqual([sam.id, priya.id].sort());
  });
});

describe("groupByMonth", () => {
  it("groups consecutive moments by month in order", () => {
    const groups = groupByMonth([{ date: "2026-10-22" }, { date: "2026-10-01" }, { date: "2026-09-14" }]);
    expect(groups.map((g) => [g.label, g.moments.length])).toEqual([
      ["October 2026", 2],
      ["September 2026", 1],
    ]);
  });
});

describe("groupByDay", () => {
  it("groups consecutive moments by day in order", () => {
    const groups = groupByDay([{ date: "2026-10-22" }, { date: "2026-10-22" }, { date: "2026-10-20" }]);
    expect(groups.map((g) => [g.key, g.moments.length])).toEqual([
      ["2026-10-22", 2],
      ["2026-10-20", 1],
    ]);
  });
});
