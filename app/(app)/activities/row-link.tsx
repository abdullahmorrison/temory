"use client";

import { usePathname } from "next/navigation";
import { PanelLink } from "@/components/nav-stack";

/** A row on the activity list, shaded while its activity is open beside the list. */
export function RowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const open = path === href || path.startsWith(`${href}/`);
  return (
    <PanelLink
      href={href}
      aria-current={open ? "page" : undefined}
      className={`flex items-center gap-4 rounded-2xl py-3 transition-colors desk:px-3 desk:hover:bg-surface/60 ${open ? "desk:bg-surface" : ""}`}
    >
      {children}
    </PanelLink>
  );
}
