import { describe, expect, it } from "vitest";
import { openDb } from "./db";
import { createType, listTypes } from "./relationship-types";

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
