import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { EmojiBadge } from "@/components/emoji-badge";
import { PanelLink } from "@/components/nav-stack";
import { Panel } from "@/components/panel";
import { dayLabel } from "@/lib/dates";
import { initials } from "@/lib/names";
import { listPast } from "@/lib/people";
import { personColor } from "@/lib/person-colors";
import { signedIn } from "@/lib/session";

export const metadata: Metadata = { title: "Past · Temory" };

/** Relationships that are over: off the tiers, kept here to look back on. */
async function PastList() {
  const people = listPast(await signedIn());
  if (!people.length) return <p className="mt-6 font-serif text-[1.0625rem] text-muted/70">No one here. End a relationship from someone&apos;s Edit page.</p>;
  return (
    <ul className="mt-6 flex flex-col">
      {people.map((p) => {
        const color = personColor(p.color);
        return (
          <li key={p.id}>
            <PanelLink href={`/people/${p.id}`} className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface/70">
              {/* Faded, like an old photo. */}
              <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-sm opacity-60 ring-2 ring-halo ${color.fill} ${color.ink}`}>
                {initials(p.name)}
                <EmojiBadge emoji={p.emoji} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.9375rem]">{p.name}</span>
                <span className="text-xs text-muted">
                  Past since {dayLabel(p.endedAt)}
                  {p.lastMoment && `  ·  last moment ${dayLabel(p.lastMoment)}`}
                </span>
              </span>
              <ChevronRight size="1.125rem" className="shrink-0 text-muted" />
            </PanelLink>
          </li>
        );
      })}
    </ul>
  );
}

export default function PastPage() {
  return (
    <Panel close={{ href: "/people", label: "Close" }}>
      <BackLink href="/people" label="Back to people" />
      <h1 className="mt-6 text-[1.75rem] font-medium desk:mt-0 desk:text-2xl">Past</h1>
      <p className="mt-1 text-[0.8125rem] text-muted">People you were close to once. Their moments stay in your journal.</p>
      <Suspense>
        <PastList />
      </Suspense>
    </Panel>
  );
}
