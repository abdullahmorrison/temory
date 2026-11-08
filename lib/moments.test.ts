import { describe, expect, it } from "vitest";
import { entryActivities, entryPeople } from "@/db/schema";
import { createActivity, deleteActivity } from "./activities";
import { openDb } from "./db";
import { createMoment, deleteMoment, formDefaults, getMoment, groupByDay, groupByMonth, listMoments, updateMoment } from "./moments";
import { createPerson, deletePerson } from "./people";

function setup() {
  const db = openDb(":memory:");
  const sam = createPerson(db, { name: "Sam Rivera" });
  const priya = createPerson(db, { name: "Priya Shah" });
  return { db, sam, priya };
}

describe("createMoment", () => {
  it("saves the text, date, and people", () => {
    const { db, sam, priya } = setup();
    const m = createMoment(db, { body: "  Ramen on 5th.  ", date: "2026-10-20", personIds: [sam.id, priya.id, sam.id] });
    expect(getMoment(db, m.id)).toMatchObject({
      body: "Ramen on 5th.",
      date: "2026-10-20",
      people: [
        { id: priya.id, name: "Priya Shah" },
        { id: sam.id, name: "Sam Rivera" },
      ],
    });
  });

  it("allows a solo moment", () => {
    const { db } = setup();
    const m = createMoment(db, { body: "Rough day.", date: "2026-10-22", personIds: [] });
    expect(getMoment(db, m.id)?.people).toEqual([]);
  });

  it("rejects empty text, bad dates, and unknown people", () => {
    const { db } = setup();
    expect(() => createMoment(db, { body: "  ", date: "2026-10-22", personIds: [] })).toThrow("Write something");
    expect(() => createMoment(db, { body: "Hi", date: "2026-02-30", personIds: [] })).toThrow("Pick a date");
    expect(() => createMoment(db, { body: "Hi", date: "2026-10-22", personIds: [999] })).toThrow("no longer exists");
    expect(listMoments(db)).toHaveLength(0);
  });
});

describe("time", () => {
  it("is kept when given and empty when not, and rejects a bad one", () => {
    const { db } = setup();
    const timed = createMoment(db, { body: "Ramen", date: "2026-10-20", time: "19:15", personIds: [] });
    const untimed = createMoment(db, { body: "Lunch", date: "2026-10-20", time: "", personIds: [] });
    expect(getMoment(db, timed.id)).toMatchObject({ time: "19:15" });
    expect(formDefaults(getMoment(db, untimed.id))).toMatchObject({ time: "" });
    expect(() => createMoment(db, { body: "Hi", date: "2026-10-20", time: "25:00", personIds: [] })).toThrow("Pick a time");
  });

  it("orders a day by time, latest first, with untimed moments after", () => {
    const { db } = setup();
    createMoment(db, { body: "No time", date: "2026-10-22", personIds: [] });
    createMoment(db, { body: "Noon", date: "2026-10-22", time: "12:30", personIds: [] });
    createMoment(db, { body: "Night", date: "2026-10-22", time: "21:40", personIds: [] });
    createMoment(db, { body: "Yesterday", date: "2026-10-21", time: "23:00", personIds: [] });
    expect(listMoments(db).map((m) => m.body)).toEqual(["Night", "Noon", "No time", "Yesterday"]);
  });
});

describe("activities", () => {
  it("saves what a moment was spent doing, and what its text names", () => {
    const { db } = setup();
    const hiking = createActivity(db, { name: "Hiking", icon: "mountain" });
    const games = createActivity(db, { name: "Board games", icon: "dices" });
    const m = createMoment(db, {
      body: "/[Board games](activity:" + games.id + ") all night",
      date: "2026-10-22",
      personIds: [],
      activityIds: [hiking.id, games.id, games.id],
      activityViaMention: [games.id, 999],
    });
    const saved = getMoment(db, m.id)!;
    expect(saved.activities).toEqual([
      { id: games.id, name: "Board games", icon: "dices", viaMention: true },
      { id: hiking.id, name: "Hiking", icon: "mountain", viaMention: false },
    ]);
    expect(saved.mentionedActivities).toEqual([{ id: games.id, name: "Board games" }]);
    expect(formDefaults(saved)).toMatchObject({ activityIds: [games.id, hiking.id], activityViaMention: [games.id] });
  });

  it("narrows to one activity's moments, newest first", () => {
    const { db } = setup();
    const hiking = createActivity(db, { name: "Hiking", icon: "mountain" });
    const games = createActivity(db, { name: "Board games", icon: "dices" });
    createMoment(db, { body: "Hike", date: "2026-10-01", personIds: [], activityIds: [hiking.id] });
    createMoment(db, { body: "Both", date: "2026-10-20", personIds: [], activityIds: [hiking.id, games.id] });
    createMoment(db, { body: "Neither", date: "2026-10-22", personIds: [] });
    expect(listMoments(db, { activityId: hiking.id }).map((m) => m.body)).toEqual(["Both", "Hike"]);
    expect(listMoments(db, { activityId: games.id }).map((m) => m.body)).toEqual(["Both"]);
  });

  it("rejects unknown activities, replaces them on edit, and drops deleted ones", () => {
    const { db } = setup();
    const hiking = createActivity(db, { name: "Hiking", icon: "mountain" });
    const games = createActivity(db, { name: "Board games", icon: "dices" });
    expect(() => createMoment(db, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [999] })).toThrow("no longer exists");
    const m = createMoment(db, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [hiking.id] });
    updateMoment(db, m.id, { body: "Hi", date: "2026-10-22", personIds: [], activityIds: [games.id] });
    expect(getMoment(db, m.id)?.activities.map((a) => a.id)).toEqual([games.id]);
    deleteActivity(db, games.id);
    expect(getMoment(db, m.id)?.activities).toEqual([]);
    deleteMoment(db, m.id);
    expect(db.select().from(entryActivities).all()).toHaveLength(0);
  });
});

describe("updateMoment", () => {
  it("replaces the text, date, and people", () => {
    const { db, sam, priya } = setup();
    const m = createMoment(db, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    updateMoment(db, m.id, { body: "Ramen with Priya", date: "2026-10-21", personIds: [priya.id] });
    expect(getMoment(db, m.id)).toMatchObject({ body: "Ramen with Priya", date: "2026-10-21", people: [{ id: priya.id }] });
  });

  it("leaves the moment as it was when an edit is rejected", () => {
    const { db, sam } = setup();
    const m = createMoment(db, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    expect(() => updateMoment(db, m.id, { body: "  ", date: "2026-10-21", personIds: [] })).toThrow("Write something");
    expect(() => updateMoment(db, m.id, { body: "Ramen", date: "2026-10-21", personIds: [999] })).toThrow("no longer exists");
    expect(getMoment(db, m.id)).toMatchObject({ body: "Ramen", date: "2026-10-20", people: [{ id: sam.id }] });
  });

  it("fails clearly when the moment is gone", () => {
    const { db } = setup();
    expect(() => updateMoment(db, 999, { body: "Hi", date: "2026-10-22", personIds: [] })).toThrow("no longer exists");
  });
});

describe("deleteMoment", () => {
  it("removes the moment and its links", () => {
    const { db, sam } = setup();
    const m = createMoment(db, { body: "Ramen", date: "2026-10-20", personIds: [sam.id] });
    deleteMoment(db, m.id);
    expect(getMoment(db, m.id)).toBeUndefined();
    expect(db.select().from(entryPeople).all()).toHaveLength(0);
  });
});

describe("listMoments", () => {
  it("lists newest first, and a deleted person drops out of their moments", () => {
    const { db, sam } = setup();
    createMoment(db, { body: "Older", date: "2026-09-14", personIds: [sam.id] });
    createMoment(db, { body: "Newer", date: "2026-10-20", personIds: [sam.id] });
    createMoment(db, { body: "Same day, later", date: "2026-10-20", personIds: [] });
    expect(listMoments(db).map((m) => m.body)).toEqual(["Same day, later", "Newer", "Older"]);
    deletePerson(db, sam.id);
    expect(listMoments(db).every((m) => m.people.length === 0)).toBe(true);
  });

  it("narrows to one person's moments, still listing everyone in them", () => {
    const { db, sam, priya } = setup();
    createMoment(db, { body: "Both", date: "2026-10-20", personIds: [sam.id, priya.id] });
    createMoment(db, { body: "Just Priya", date: "2026-10-21", personIds: [priya.id] });
    createMoment(db, { body: "Solo", date: "2026-10-22", personIds: [] });
    const sams = listMoments(db, { personId: sam.id });
    expect(sams.map((m) => m.body)).toEqual(["Both"]);
    expect(sams[0].people.map((p) => p.id)).toEqual([priya.id, sam.id]);
    expect(listMoments(db, { personId: priya.id }).map((m) => m.body)).toEqual(["Just Priya", "Both"]);
  });
});

describe("people there only because of a mention", () => {
  it("are stored as such, while everyone else is kept, and an edit can lock them in", () => {
    const { db, sam, priya } = setup();
    const body = "Ramen with @[Sam Rivera](person:" + sam.id + ")";
    const m = createMoment(db, { body, date: "2026-10-20", personIds: [sam.id, priya.id], viaMention: [sam.id] });
    expect(getMoment(db, m.id).people).toMatchObject([
      { id: priya.id, viaMention: false },
      { id: sam.id, viaMention: true },
    ]);
    updateMoment(db, m.id, { body, date: "2026-10-20", personIds: [sam.id, priya.id] });
    expect(getMoment(db, m.id).people.every((p) => !p.viaMention)).toBe(true);
  });

  it("ignores a mention flag for someone not in the moment", () => {
    const { db, sam, priya } = setup();
    const m = createMoment(db, { body: "Hi", date: "2026-10-20", personIds: [priya.id], viaMention: [sam.id] });
    expect(getMoment(db, m.id).people).toMatchObject([{ id: priya.id, viaMention: false }]);
  });
});

describe("mentioned", () => {
  it("lists everyone the text mentions, in the moment or not, and skips deleted people", () => {
    const { db, sam, priya } = setup();
    const gone = createPerson(db, { name: "Omar Farouk" });
    const body = `@[Sam Rivera](person:${sam.id}) and @[Priya Shah](person:${priya.id}) and @[Omar Farouk](person:${gone.id})`;
    const m = createMoment(db, { body, date: "2026-10-20", personIds: [sam.id] });
    deletePerson(db, gone.id);
    expect(getMoment(db, m.id).mentioned.map((p) => p.id).sort()).toEqual([sam.id, priya.id].sort());
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
