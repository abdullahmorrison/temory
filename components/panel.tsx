import { X } from "lucide-react";
import { CloseLink } from "@/components/nav-stack";

/** A full page on phones; a side panel beside the people arcs on desktop, closed with ✕ unless the content brings its own. */
export function Panel({ close, children }: { close?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-xl px-7 pt-12 pb-10 desk:mx-0 desk:h-dvh desk:w-110 desk:max-w-none desk:shrink-0 desk:overflow-y-auto desk:border-l desk:border-line desk:px-9 desk:pt-8">
      {close && (
        <CloseLink
          href={close.href}
          aria-label={close.label}
          className="absolute top-7 right-7 hidden rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink desk:flex"
        >
          <X size="1.25rem" />
        </CloseLink>
      )}
      {children}
    </div>
  );
}
