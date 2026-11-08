import { ChevronLeft } from "lucide-react";
import { CloseLink } from "@/components/nav-stack";

/** Goes back to the page under this one. Phones only, where the panel's ✕ closes instead; `everywhere` keeps it on desktop for a step back inside the panel. */
export function BackLink({ href, label, everywhere }: { href: string; label: string; everywhere?: boolean }) {
  return (
    <CloseLink
      href={href}
      aria-label={label}
      className={`-ml-1 inline-flex self-start rounded-full p-1 text-ink transition-colors hover:bg-surface ${everywhere ? "" : "desk:hidden"}`}
    >
      <ChevronLeft size="1.5rem" />
    </CloseLink>
  );
}
