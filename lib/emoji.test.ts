import { describe, expect, it } from "vitest";
import { isOneEmoji, lastEmoji } from "./emoji";

describe("isOneEmoji", () => {
  it("accepts one emoji, even one made of several code points", () => {
    for (const e of ["⚽", "☕", "🏋️", "👩🏽‍💻", "🇯🇵", "👨‍👩‍👧"]) expect(isOneEmoji(e), e).toBe(true);
  });

  it("rejects text, two emoji, or nothing", () => {
    for (const e of ["", "a", "⚽⚽", "⚽ ", "1"]) expect(isOneEmoji(e), e).toBe(false);
  });
});

describe("lastEmoji", () => {
  it("keeps the last emoji typed", () => {
    expect(lastEmoji("hi ⚽ ☕")).toBe("☕");
    expect(lastEmoji("hello")).toBe("");
  });
});
