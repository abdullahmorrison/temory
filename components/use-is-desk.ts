"use client";

import { useSyncExternalStore } from "react";

const DESK_QUERY = "(min-width: 1024px)"; // matches the `desk` breakpoint in globals.css

/** True on desktop-sized screens; false while rendering on the server. */
export function useIsDesk() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(DESK_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(DESK_QUERY).matches,
    () => false,
  );
}
