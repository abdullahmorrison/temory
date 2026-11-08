import { describe, expect, it } from "vitest";
import { layoutTiers, tierAt, type LayoutPerson } from "./tier-layout";
import { TIERS } from "./tiers";

const phone = { width: 402, height: 800, top: 100, bottom: 140, tiers: TIERS };
const people = (n: number, closeness: number): LayoutPerson[] =>
  Array.from({ length: n }, (_, i) => ({ id: closeness * 100 + i, name: `P${String(i).padStart(2, "0")}`, closeness, color: 0, emoji: "" }));

describe("layoutTiers", () => {
  it("puts the closest tier lowest on screen", () => {
    const { bands } = layoutTiers([], phone);
    const labels = bands.map((b) => b.labelY);
    expect(labels).toEqual([...labels].sort((a, b) => b - a));
    expect(bands[0].label).toBe("Inner circle");
    expect(bands.at(-1)!.label).toBe("Prospects");
  });

  it("counts everyone in a tier, including hidden people", () => {
    const { bands } = layoutTiers(people(30, 4), phone);
    expect(bands[3].count).toBe(30);
  });

  it("shows everyone when they fit", () => {
    const { bubbles } = layoutTiers(people(3, 1), phone);
    expect(bubbles.filter((b) => b.kind === "person")).toHaveLength(3);
    expect(bubbles.some((b) => b.kind === "overflow")).toBe(false);
  });

  it("places a tier's people left to right in the order given", () => {
    const given = people(3, 1).reverse();
    const shown = layoutTiers(given, phone).bubbles.flatMap((b) => (b.kind === "person" ? [b] : []));
    expect(shown.sort((a, b) => a.x - b.x).map((b) => b.person.id)).toEqual(given.map((p) => p.id));
  });

  it("adds an overflow bubble when a tier is full", () => {
    const { bubbles } = layoutTiers(people(30, 4), phone);
    const shown = bubbles.filter((b) => b.kind === "person").length;
    const overflow = bubbles.find((b) => b.kind === "overflow");
    expect(overflow).toBeDefined();
    expect(shown + (overflow?.kind === "overflow" ? overflow.hidden : 0)).toBe(30);
  });

  it("fits more people on a wider screen", () => {
    const narrow = layoutTiers(people(30, 4), phone).bubbles.filter((b) => b.kind === "person").length;
    const wide = layoutTiers(people(30, 4), { ...phone, width: 1200 }).bubbles.filter((b) => b.kind === "person").length;
    expect(wide).toBeGreaterThan(narrow);
  });

  it("keeps every bubble inside the screen", () => {
    for (const width of [360, 402, 1200]) {
      for (const b of layoutTiers([...people(3, 1), ...people(6, 2), ...people(12, 3), ...people(30, 4)], { ...phone, width }).bubbles) {
        expect(b.x - b.size / 2).toBeGreaterThanOrEqual(0);
        expect(b.x + b.size / 2).toBeLessThanOrEqual(width);
      }
    }
  });

  it("centres a lone person", () => {
    const [b] = layoutTiers(people(1, 2), phone).bubbles;
    expect(b.x).toBe(phone.width / 2);
  });
});

describe("tierAt", () => {
  const layout = layoutTiers([], phone);
  const below = (tierIndex: number) => ({ x: phone.width / 2, y: layout.bands[tierIndex].labelY + 30 });

  it("finds the tier whose band contains the point", () => {
    expect(TIERS.map((_, i) => tierAt(layout, below(i)))).toEqual(TIERS.map((t) => t.value));
  });

  it("treats anything below the closest arc as the closest tier", () => {
    expect(tierAt(layout, { x: phone.width / 2, y: phone.height })).toBe(TIERS[0].value);
  });

  it("treats anything past the farthest arc as the farthest tier", () => {
    expect(tierAt(layout, { x: phone.width / 2, y: 0 })).toBe(TIERS.at(-1)!.value);
  });
});
