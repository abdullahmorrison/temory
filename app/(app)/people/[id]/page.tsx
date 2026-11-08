import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { EmojiBadge } from "@/components/emoji-badge";
import { Panel } from "@/components/panel";
import { MomentItem } from "@/components/moment-item";
import { SectionLabel } from "@/components/section-label";
import { getDb } from "@/lib/db";
import { listMoments } from "@/lib/moments";
import { firstName, initials } from "@/lib/names";
import { personColor } from "@/lib/person-colors";
import { tierLabel } from "@/lib/tiers";
import { personFromParams } from "./data";

const LATEST = 3; // moments shown on the profile before "All N moments"

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const person = await personFromParams(params);
  const color = personColor(person.color);
  const moments = listMoments(getDb(), { personId: person.id });
  return (
    <Panel close={{ href: "/people", label: "Close" }}>
      <div className="flex items-center justify-between desk:-ml-3">
        <BackLink href="/people" label="Back to people" />
        <Link href={`/people/${person.id}/edit`} className="rounded-full px-3 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-ink">
          Edit
        </Link>
      </div>

      <div className="mt-6 flex flex-col items-center gap-1.5 text-center desk:flex-row desk:gap-4 desk:text-left">
        <span
          className={`relative flex size-22 shrink-0 items-center justify-center rounded-full font-serif text-[2rem] shadow-(--shadow-avatar) ring-2 ring-halo ${color.fill} ${color.ink}`}
        >
          {initials(person.name)}
          <EmojiBadge emoji={person.emoji} />
        </span>
        <div>
          <h1 className="mt-2 text-[1.75rem] font-medium desk:mt-0 desk:text-2xl">{person.name}</h1>
          <p className="text-[0.8125rem] text-muted">{tierLabel(person.closeness)}</p>
        </div>
      </div>

      <section className="mt-10 flex flex-col gap-2.5">
        <SectionLabel>Notes</SectionLabel>
        {person.notes ? (
          <p className="font-serif text-[1.0625rem] leading-[1.6875rem] whitespace-pre-line">{person.notes}</p>
        ) : (
          <Link href={`/people/${person.id}/edit`} className="font-serif text-[1.0625rem] text-muted/70 hover:text-muted">
            Add notes about {firstName(person.name)}…
          </Link>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <SectionLabel>Journal</SectionLabel>
          {moments.length > LATEST && (
            <Link href={`/people/${person.id}/moments`} className="text-xs text-accent underline-offset-4 hover:underline">
              All {moments.length} moments
            </Link>
          )}
        </div>
        {moments.length ? (
          <div className="flex flex-col gap-1">
            {moments.slice(0, LATEST).map((m) => (
              <MomentItem key={m.id} moment={m} about={{ person: person.id }} href={`/people/${person.id}/moments/${m.id}`} />
            ))}
          </div>
        ) : (
          <Link href="/write" className="font-serif text-[1.0625rem] text-muted/70 hover:text-muted">
            No moments with {firstName(person.name)} yet. Write one…
          </Link>
        )}
      </section>
    </Panel>
  );
}

export default function PersonPage(props: PageProps<"/people/[id]">) {
  return (
    <Suspense>
      <Profile params={props.params} />
    </Suspense>
  );
}
