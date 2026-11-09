import { describe, expect, it } from "vitest";
import { entries, entryPeople } from "@/db/schema";
import { createPerson, deletePerson, getPerson, listPeople, listTier, moveToTier, updatePerson } from "./people";
import { listTypes } from "./relationship-types";
import { NEW_PERSON_CLOSENESS } from "./tiers";
import { account } from "./test-account";

describe("createPerson", () => {
  it("gives the first six people six different colors", () => {
    const my = account();
    const colors = ["Sam", "Priya", "Jordan", "Leila", "Marcus", "Theo"].map((name) => createPerson(my, { name }).color);
    expect(new Set(colors).size).toBe(6);
  });

  it("shows the emoji of the person's relationship type as their badge", () => {
    const my = account();
    const coworker = listTypes(my).find((t) => t.name === "Coworker")!;
    const sam = createPerson(my, { name: "Sam", typeId: coworker.id });
    const priya = createPerson(my, { name: "Priya" });
    expect(getPerson(my, sam.id)?.emoji).toBe("💼");
    expect(getPerson(my, priya.id)?.emoji).toBe("");
    expect(listPeople(my).map((p) => [p.name, p.emoji])).toEqual([["Priya", ""], ["Sam", "💼"]]);
  });

  it("puts new people in the outermost tier and trims the name", () => {
    const my = account();
    const p = createPerson(my, { name: "  Noor " });
    expect(p.name).toBe("Noor");
    expect(p.closeness).toBe(NEW_PERSON_CLOSENESS);
  });

  it("rejects a blank name", () => {
    const my = account();
    expect(() => createPerson(my, { name: "   " })).toThrow("needs a name");
  });

  it("rejects a closeness outside the tiers", () => {
    const my = account();
    expect(() => createPerson(my, { name: "Sam", closeness: 0 })).toThrow("Unknown closeness");
    expect(() => createPerson(my, { name: "Sam", closeness: 7 })).toThrow("Unknown closeness");
  });
});

describe("updatePerson", () => {
  it("changes name, closeness, and notes but keeps the color", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    const updated = updatePerson(my, sam.id, { name: " Sam Rivera ", closeness: 1, notes: " Met at soccer " });
    expect(updated).toMatchObject({ name: "Sam Rivera", closeness: 1, notes: "Met at soccer", color: sam.color });
  });

  it("applies the same checks as creating", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    expect(() => updatePerson(my, sam.id, { name: "" })).toThrow("needs a name");
    expect(() => updatePerson(my, sam.id, { name: "Sam", closeness: 9 })).toThrow("Unknown closeness");
  });

  it("fails clearly when the person is gone", () => {
    const my = account();
    expect(() => updatePerson(my, 999, { name: "Ghost" })).toThrow("no longer exists");
  });
});

describe("deletePerson", () => {
  it("removes the person but keeps their moments", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    const entry = my.db.insert(entries).values({ body: "Ramen", date: "2026-10-20" }).returning().get();
    my.db.insert(entryPeople).values({ entryId: entry.id, personId: sam.id }).run();

    deletePerson(my, sam.id);

    expect(getPerson(my, sam.id)).toBeUndefined();
    expect(my.db.select().from(entries).all()).toHaveLength(1);
    expect(my.db.select().from(entryPeople).all()).toHaveLength(0);
  });
});

describe("moveToTier", () => {
  it("changes only the closeness", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam", notes: "Soccer" });
    expect(moveToTier(my, sam.id, 1)).toMatchObject({ name: "Sam", notes: "Soccer", color: sam.color, closeness: 1 });
  });

  it("rejects unknown tiers and missing people", () => {
    const my = account();
    const sam = createPerson(my, { name: "Sam" });
    expect(() => moveToTier(my, sam.id, 0)).toThrow("Unknown closeness");
    expect(() => moveToTier(my, 999, 1)).toThrow("no longer exists");
  });
});

describe("listPeople", () => {
  it("puts those in the most moments first, then A to Z ignoring case", () => {
    const my = account();
    const [zoe, abe, ben] = ["Zoe", "abe", "Ben"].map((name) => createPerson(my, { name }));
    for (let i = 0; i < 2; i++) {
      const entry = my.db.insert(entries).values({ body: "Hi", date: "2026-01-05" }).returning().get();
      my.db.insert(entryPeople).values({ entryId: entry.id, personId: zoe.id }).run();
    }
    expect(listPeople(my).map((p) => p.id)).toEqual([zoe.id, abe.id, ben.id]);
  });

  it("breaks a tie by whose latest moment is newest, by day and then time", () => {
    const my = account();
    const [ana, bo, cy] = ["Ana", "Bo", "Cy"].map((name) => createPerson(my, { name }));
    const log = (personId: number, date: string, time: string | null = null) => {
      const entry = my.db.insert(entries).values({ body: "Hi", date, time }).returning().get();
      my.db.insert(entryPeople).values({ entryId: entry.id, personId }).run();
    };
    log(ana.id, "2026-10-01", "09:00");
    log(bo.id, "2026-10-20");
    log(cy.id, "2026-10-20", "19:15");
    expect(listPeople(my).map((p) => p.id)).toEqual([cy.id, bo.id, ana.id]);
  });
});

describe("listTier", () => {
  it("lists one tier by how many moments each person is in, with their latest", () => {
    const my = account();
    const [noor, eli, dev] = ["Noor", "Eli", "Dev"].map((name) => createPerson(my, { name }));
    createPerson(my, { name: "Sam", closeness: 1 });
    const log = (date: string, ...ids: number[]) => {
      const entry = my.db.insert(entries).values({ body: "Hi", date }).returning().get();
      for (const personId of ids) my.db.insert(entryPeople).values({ entryId: entry.id, personId }).run();
    };
    log("2026-01-05", noor.id, eli.id);
    log("2026-09-01", noor.id);
    log("2026-10-01", dev.id);
    expect(listTier(my, NEW_PERSON_CLOSENESS)).toEqual([
      { id: noor.id, name: "Noor", color: noor.color, emoji: "", lastMoment: "2026-09-01" },
      { id: dev.id, name: "Dev", color: dev.color, emoji: "", lastMoment: "2026-10-01" },
      { id: eli.id, name: "Eli", color: eli.color, emoji: "", lastMoment: "2026-01-05" },
    ]);
  });
});
