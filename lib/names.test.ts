import { describe, expect, it } from "vitest";
import { firstName, initials, listNames } from "./names";

describe("initials", () => {
  it("uses first and last word", () => expect(initials("Sam de la Rivera")).toBe("SR"));
  it("uses two letters for one word", () => expect(initials("mom")).toBe("MO"));
  it("ignores extra spaces", () => expect(initials("  Priya   Shah ")).toBe("PS"));
});

describe("firstName", () => {
  it("returns the first word", () => expect(firstName("Priya Shah")).toBe("Priya"));
});

describe("listNames", () => {
  it("names one or two, then counts the rest", () => {
    expect(listNames(["Jess"])).toBe("Jess");
    expect(listNames(["Jess", "Sam"])).toBe("Jess and Sam");
    expect(listNames(["Jess", "Sam", "Priya"])).toBe("Jess and 2 others");
  });
});
