"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { useIsDesk } from "@/components/use-is-desk";
import { type Arrival, arrive, close as closePlan, level, type Plan } from "@/lib/nav-stack";

// The browser's Back should only undo pages that sit on top of another: a profile over People on a
// phone, a moment over a profile, a form over what it edits. Everything else (switching tabs, opening
// a panel beside the list on desktop, leaving a form) replaces the current entry, so Back from there
// leaves the app.
//
// The browser doesn't say which entries are below the current one, so this keeps its own copy of the
// app's part of the history (lib/nav-stack.ts has the rules). After a reload it starts over from the
// current page, which only means a close replaces instead of going back.

type Router = ReturnType<typeof useRouter>;

let stack: string[] = [];
// How the next path change happens. Link and router.push leave it unset, which means a push.
let incoming: Arrival = "push";
// What to do once a jump back through history lands: go on to another page, or refetch the one landed on.
let afterPop: { replace?: string; refresh?: boolean } | null = null;

function track(path: string, router: Router) {
  stack = arrive(stack, path, incoming);
  incoming = "push";

  const next = afterPop;
  afterPop = null;
  // The stack holds paths without queries, so compare the full address: closing to /places from an
  // entry that was /places?place=3 still has to drop the query.
  if (next?.replace && next.replace !== path + window.location.search) {
    incoming = "replace";
    router.replace(next.replace);
  } else if (next?.refresh) router.refresh();
}

/** Keeps the stack in step with navigation. Rendered once, in the app layout. */
export function NavStack() {
  return (
    <Suspense>
      <Tracker />
    </Suspense>
  );
}

function Tracker() {
  const path = usePathname();
  const router = useRouter();
  useEffect(() => {
    const onPop = () => (incoming = "pop");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => track(path, router), [path, router]);
  return null;
}

function follow(router: Router, { back, replace }: Plan, refresh = false) {
  if (back > 0) {
    afterPop = { replace, refresh };
    window.history.go(-back);
  } else if (replace) {
    incoming = "replace";
    router.replace(replace);
  }
}

/** Goes to a page as if it were the bottom of the app's history, like switching tabs. */
export function goLevel(router: Router, href: string) {
  follow(router, level(stack, href));
}

/**
 * Leaves the current page for `href`: back through history if `href` is under it, so Back doesn't return
 * here; otherwise as if `href` were the bottom of the app's history. `refresh` refetches the page landed on.
 */
export function close(router: Router, href: string, { refresh = false } = {}) {
  const plan = closePlan(stack, href);
  follow(router, { ...plan, replace: plan.replace ?? href }, refresh);
}

/** Once a form's action reports where it's done, closes the form to there, refetching what's there. */
export function useCloseOnDone(state: { done?: string }) {
  const router = useRouter();
  // Next keeps a left page alive and re-runs its effects on return, so each result closes the form only once.
  const handled = useRef(state);
  useEffect(() => {
    if (!state.done || handled.current === state) return;
    handled.current = state;
    close(router, state.done, { refresh: true });
  }, [state, router]);
}

type LinkProps = Omit<React.ComponentProps<typeof Link>, "href" | "onNavigate" | "replace"> & { href: string };

/** A link to a tab, or anything else that's the bottom of the app's history. */
export function LevelLink({ href, ...props }: LinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onNavigate={(e) => {
        e.preventDefault();
        goLevel(router, href);
      }}
      {...props}
    />
  );
}

/** Opens a page over the list on phones, or in the panel beside it on desktop, swapping what's there. */
export function PanelLink({ href, ...props }: LinkProps) {
  const desk = useIsDesk();
  return (
    <Link
      href={href}
      replace={desk}
      onNavigate={() => {
        if (desk) incoming = "replace";
      }}
      {...props}
    />
  );
}

/** Leaves the current page for the one under it, going back instead of adding to history. */
export function CloseLink({ href, ...props }: LinkProps) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onNavigate={(e) => {
        e.preventDefault();
        close(router, href);
      }}
      {...props}
    />
  );
}
