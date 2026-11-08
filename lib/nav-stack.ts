// The app's part of the browser history, as paths bottom first: what Back would return to. These are
// the rules for keeping it and for leaving a page; components/nav-stack.tsx applies them to the browser.

/** How the current page was reached: a link or router.push, a replace, or the browser's Back or Forward. */
export type Arrival = "push" | "replace" | "pop";

/** The stack after arriving at `path`. */
export function arrive(stack: string[], path: string, how: Arrival): string[] {
  if (stack.length === 0) return [path];
  if (how === "replace") return [...stack.slice(0, -1), path];
  if (how === "pop") {
    // Back lands on a page already in the stack; anything else (Forward) starts over from here.
    const i = stack.lastIndexOf(path);
    return i === -1 ? [path] : stack.slice(0, i + 1);
  }
  return stack.at(-1) === path ? stack : [...stack, path];
}

/** How to get somewhere: back through history a number of steps, then optionally replace what's there. */
export type Plan = { back: number; replace?: string };

/** To a page as if it were the bottom of the stack, like switching tabs: unwind everything, then replace. */
export function level(stack: string[], href: string): Plan {
  return { back: Math.max(stack.length - 1, 0), replace: href };
}

/** Leaving the current page for `href`: back to it if it's under this one, otherwise as if it were the bottom. */
export function close(stack: string[], href: string): Plan {
  // Below the current page only; with nothing below, a negative start would search the current page.
  const i = stack.length > 1 ? stack.lastIndexOf(href, stack.length - 2) : -1;
  return i === -1 ? level(stack, href) : { back: stack.length - 1 - i };
}
