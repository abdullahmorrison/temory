import { describe, expect, it } from "vitest";
import { openDb } from "./db";
import { createPerson, getPerson } from "./people";
import { createType, deleteType, listTypes, updateType } from "./relationship-types";

describe("listTypes", () => {
  it("lists the presets in their saved order, then yours as you added them", () => {
    const db = openDb(":memory:");
    createType(db, { name: "Teammate", emoji: "⚽" });
    createType(db, { name: "Climber", emoji: "🧗" });
    expect(listTypes(db).map((t) => t.name)).toEqual([
      "Coworker",
      "Classmate",
      "Mutual",
      "Neighbor",
      "Romantic",
      "Online",
      "Childhood",
      "Family",
      "Teammate",
      "Climber",
    ]);
  });
});

describe("createType", () => {
  it("trims it and needs a name, one emoji, and a name you don't already have", () => {
    const db = openDb(":memory:");
    expect(createType(db, { name: " Climber ", emoji: " 🧗 " })).toMatchObject({ name: "Climber", emoji: "🧗", preset: false });
    expect(() => createType(db, { name: " ", emoji: "🧗" })).toThrow("needs a name");
    expect(() => createType(db, { name: "Runner", emoji: "" })).toThrow("emoji");
    expect(() => createType(db, { name: "Runner", emoji: "🏃🏃" })).toThrow("emoji");
    expect(() => createType(db, { name: "coworker", emoji: "💼" })).toThrow("already have");
  });
});

describe("updateType", () => {
  it("renames your type or changes its emoji, but not into a name you already have", () => {
    const db = openDb(":memory:");
    const t = createType(db, { name: "Climbr", emoji: "🧗" });
    expect(updateType(db, t.id, { name: "Climber", emoji: "🪨" })).toMatchObject({ name: "Climber", emoji: "🪨" });
    expect(updateType(db, t.id, { name: "climber", emoji: "🪨" }).name).toBe("climber");
    expect(() => updateType(db, t.id, { name: "Neighbor", emoji: "🪨" })).toThrow("already have");
  });

  it("leaves the presets alone", () => {
    const db = openDb(":memory:");
    const coworker = listTypes(db).find((t) => t.name === "Coworker")!;
    expect(() => updateType(db, coworker.id, { name: "Colleague", emoji: "💼" })).toThrow("can't be changed");
  });
});

describe("deleteType", () => {
  it("deletes your type and leaves its people with none", () => {
    const db = openDb(":memory:");
    const t = createType(db, { name: "Climber", emoji: "🧗" });
    const jess = createPerson(db, { name: "Jess", typeId: t.id });
    expect(listTypes(db).find((x) => x.id === t.id)?.people).toBe(1);
    deleteType(db, t.id);
    expect(listTypes(db).some((x) => x.id === t.id)).toBe(false);
    expect(getPerson(db, jess.id)).toMatchObject({ typeId: null, emoji: "" });
  });

  it("can't delete a preset", () => {
    const db = openDb(":memory:");
    expect(() => deleteType(db, listTypes(db)[0].id)).toThrow("can't be changed");
  });
});
