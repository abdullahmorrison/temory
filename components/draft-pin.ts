"use client";

import { useSyncExternalStore } from "react";

/** The address picked in a place form that isn't saved yet, so the map beside it can pin it. */
export type DraftPin = { placeId?: number; title: string; lat: number; lng: number };

let draft: DraftPin | null = null;
const listeners = new Set<() => void>();

export function setDraftPin(next: DraftPin | null) {
  draft = next;
  listeners.forEach((listener) => listener());
}

export function useDraftPin() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => draft,
    () => null,
  );
}
