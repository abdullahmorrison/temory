"use client";

import { BookOpen, MapPin, PartyPopper, PenLine, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { TemoryMark } from "@/components/temory-mark";

const TABS = [
  { href: "/people", label: "People", Icon: Users },
  { href: "/journal", label: "Journal", Icon: BookOpen },
  { href: "/activities", label: "Activities", Icon: PartyPopper },
  { href: "/places", label: "Places", Icon: MapPin },
] as const;

// The path isn't known while prerendering routes like /people/[id], so anything that reads it sits
// in Suspense. The fallback renders the same links with nothing highlighted, so nothing shifts.
type Path = string | null;
const isActive = (path: Path, href: string) => path !== null && (path === href || path.startsWith(`${href}/`));

function WithPath({ render }: { render: (path: Path) => React.ReactNode }) {
  return (
    <Suspense fallback={render(null)}>
      <ReadPath render={render} />
    </Suspense>
  );
}

function ReadPath({ render }: { render: (path: Path) => React.ReactNode }) {
  return render(usePathname());
}

export function LogButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/write"
      className={`flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent shadow-(--shadow-cta) transition hover:brightness-110 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${className}`}
    >
      <PenLine size="1.125rem" />
      Log a moment
    </Link>
  );
}

// Form screens have their own submit button, so the floating one would compete with it.
const FORM_ROUTES = [/^\/write$/, /^\/journal\/\d+\/edit$/, /^\/people\/new$/, /^\/people\/\d+\/edit$/, /^\/places\/new$/, /^\/places\/\d+\/edit$/];
// The Places map, where a place's sheet takes the button's spot.
const NO_LOG_BUTTON = [...FORM_ROUTES, /^\/places$/];

/** Phones: floating Log a moment button above the tab bar, hidden on form screens and the Places map. */
export function FloatingLogButton() {
  return (
    <WithPath
      render={(path) =>
        path === null || NO_LOG_BUTTON.some((route) => route.test(path)) ? null : (
          <LogButton className="fixed right-4 bottom-[calc(max(env(safe-area-inset-bottom),12px)+76px)] z-20 desk:hidden" />
        )
      }
    />
  );
}

/** Phones: bottom tab bar. */
export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-paper pt-2.5 pb-[max(env(safe-area-inset-bottom),12px)] desk:hidden">
      <WithPath render={(path) => <TabBarLinks path={path} />} />
    </nav>
  );
}

function TabBarLinks({ path }: { path: Path }) {
  return (
    <>
      {TABS.map(({ href, label, Icon }) => {
        const on = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg text-[0.6875rem] transition-colors active:bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-0 ${on ? "font-medium text-accent" : "text-muted hover:text-ink"}`}
          >
            <Icon size="1.375rem" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

/** Desktop: left sidebar. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-line px-5 py-7 desk:flex">
      <Link href="/" className="flex items-center gap-2 text-[1.0625rem] font-medium">
        <span aria-hidden="true">
          <TemoryMark size={24} />
        </span>
        Temory
      </Link>
      <LogButton />
      <nav className="flex flex-1 flex-col gap-1">
        <WithPath render={(path) => <SidebarLinks path={path} />} />
      </nav>
    </aside>
  );
}

function SidebarLinks({ path }: { path: Path }) {
  return (
    <>
      {TABS.map((tab) => (
        <SidebarLink key={tab.href} {...tab} on={isActive(path, tab.href)} />
      ))}
      <SidebarLink href="/settings" label="Settings" Icon={Settings} on={isActive(path, "/settings")} className="mt-auto" />
    </>
  );
}

type SidebarLinkProps = { href: string; label: string; Icon: typeof Users; on: boolean; className?: string };

function SidebarLink({ href, label, Icon, on, className = "" }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-[0.625rem] px-3 py-2.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-0 ${on ? "bg-surface font-medium text-ink" : "text-muted hover:bg-surface/60 hover:text-ink"} ${className}`}
    >
      <Icon size="1.25rem" className={on ? "text-accent" : ""} />
      {label}
    </Link>
  );
}
