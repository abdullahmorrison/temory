import { describe, expect, it } from "vitest";
import { arrive, close, level } from "./nav-stack";

describe("arrive", () => {
  it("starts with the first page, however it was reached", () => {
    expect(arrive([], "/people/1", "pop")).toEqual(["/people/1"]);
  });

  it("adds a page opened on top", () => {
    expect(arrive(["/people"], "/people/1", "push")).toEqual(["/people", "/people/1"]);
  });

  it("doesn't add the same page twice", () => {
    expect(arrive(["/people"], "/people", "push")).toEqual(["/people"]);
  });

  it("swaps the top page on a replace", () => {
    expect(arrive(["/people", "/people/1"], "/people/2", "replace")).toEqual(["/people", "/people/2"]);
  });

  it("trims back to the page Back lands on, even several steps down", () => {
    const stack = ["/people", "/people/1", "/people/1/edit"];
    expect(arrive(stack, "/people/1", "pop")).toEqual(["/people", "/people/1"]);
    expect(arrive(stack, "/people", "pop")).toEqual(["/people"]);
  });

  it("starts over when Back or Forward lands somewhere it doesn't know", () => {
    expect(arrive(["/people", "/people/1"], "/journal", "pop")).toEqual(["/journal"]);
  });
});

describe("close", () => {
  it("goes back to the page under this one", () => {
    expect(close(["/people", "/people/1", "/people/1/edit"], "/people/1")).toEqual({ back: 1 });
  });

  it("goes back several steps when the page is further down", () => {
    // Deleting a person from their edit form returns to People, skipping the gone profile.
    expect(close(["/people", "/people/1", "/people/1/edit"], "/people")).toEqual({ back: 2 });
  });

  it("goes back to the nearest copy of the page", () => {
    expect(close(["/people/1", "/people", "/people/1", "/people/1/edit"], "/people/1")).toEqual({ back: 1 });
  });

  it("unwinds everything and replaces when the page isn't underneath", () => {
    // Saving Write opened over People lands on the journal, as its own tab.
    expect(close(["/people", "/write"], "/journal")).toEqual({ back: 1, replace: "/journal" });
  });

  it("replaces when there's nothing underneath, like after a reload", () => {
    expect(close(["/people/1"], "/people")).toEqual({ back: 0, replace: "/people" });
  });

  it("doesn't count the current page as underneath", () => {
    expect(close(["/people/1"], "/people/1")).toEqual({ back: 0, replace: "/people/1" });
  });
});

describe("level", () => {
  it("replaces the current page when it's the only one", () => {
    expect(level(["/people"], "/journal")).toEqual({ back: 0, replace: "/journal" });
  });

  it("unwinds every page on top before replacing, so Back leaves the app", () => {
    expect(level(["/people", "/people/1", "/people/1/moments"], "/journal")).toEqual({ back: 2, replace: "/journal" });
  });
});
