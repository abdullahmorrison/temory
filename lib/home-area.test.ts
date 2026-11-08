import { beforeEach, describe, expect, it, vi } from "vitest";
import { rememberHomeArea, savedHomeArea } from "./home-area";

describe("rememberHomeArea", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
  });

  it("saves a rounded area, and only replaces it after a real move", () => {
    expect(rememberHomeArea(47.6145, -122.3471)).toEqual({ lat: 47.61, lng: -122.35 });
    rememberHomeArea(47.63, -122.33); // a couple of km: same city
    expect(savedHomeArea()).toEqual({ lat: 47.61, lng: -122.35 });
    rememberHomeArea(43.6532, -79.3832); // moved to Toronto
    expect(savedHomeArea()).toEqual({ lat: 43.65, lng: -79.38 });
  });
});
