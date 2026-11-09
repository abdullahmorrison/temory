import { describe, expect, it } from "vitest";
import { createPerson, getPerson } from "./people";
import { createType, deleteType, listTypes, updateType } from "./relationship-types";
import { account } from "./test-account";

describe("listTypes", () => {
  it("lists the presets in their saved order, then yours as you added them", () => {
    const my = account();
    createType(my, { name: "Teammate", emoji: "⚽" });
    createType(my, { name: "Climber", emoji: "🧗" });
    expect(listTypes(my).map((t) => t.name)).toEqual([
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
    const my = account();
    expect(createType(my, { name: " Climber ", emoji: " 🧗 " })).toMatchObject({ name: "Climber", emoji: "🧗", preset: false });
    expect(() => createType(my, { name: " ", emoji: "🧗" })).toThrow("needs a name");
    expect(() => createType(my, { name: "Runner", emoji: "" })).toThrow("emoji");
    expect(() => createType(my, { name: "Runner", emoji: "🏃🏃" })).toThrow("emoji");
    expect(() => createType(my, { name: "coworker", emoji: "💼" })).toThrow("already have");
  });
});

describe("updateType", () => {
  it("renames your type or changes its emoji, but not into a name you already have", () => {
    const my = account();
    const t = createType(my, { name: "Climbr", emoji: "🧗" });
    expect(updateType(my, t.id, { name: "Climber", emoji: "🪨" })).toMatchObject({ name: "Climber", emoji: "🪨" });
    expect(updateType(my, t.id, { name: "climber", emoji: "🪨" }).name).toBe("climber");
    expect(() => updateType(my, t.id, { name: "Neighbor", emoji: "🪨" })).toThrow("already have");
  });

  it("leaves the presets alone", () => {
    const my = account();
    const coworker = listTypes(my).find((t) => t.name === "Coworker")!;
    expect(() => updateType(my, coworker.id, { name: "Colleague", emoji: "💼" })).toThrow("can't be changed");
  });
});

describe("deleteType", () => {
  it("deletes your type and leaves its people with none", () => {
    const my = account();
    const t = createType(my, { name: "Climber", emoji: "🧗" });
    const jess = createPerson(my, { name: "Jess", typeId: t.id });
    expect(listTypes(my).find((x) => x.id === t.id)?.people).toEqual([{ id: jess.id, name: "Jess" }]);
    deleteType(my, t.id);
    expect(listTypes(my).some((x) => x.id === t.id)).toBe(false);
    expect(getPerson(my, jess.id)).toMatchObject({ typeId: null, emoji: "" });
  });

  it("can't delete a preset", () => {
    const my = account();
    expect(() => deleteType(my, listTypes(my)[0].id)).toThrow("can't be changed");
  });
});
