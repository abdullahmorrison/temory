import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { EmojiBadge } from "@/components/emoji-badge";
import { Panel } from "@/components/panel";
import { dayLabel } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { initials } from "@/lib/names";
import { listTier } from "@/lib/people";
import { personColor } from "@/lib/person-colors";
import { TIERS } from "@/lib/tiers";

async function TierList({ params }: { params: Promise<{ tier: string }> }) {
  await connection(); // read the database per request, not at build time
  const value = Number((await params).tier);
  const tier = TIERS.find((t) => t.value === value);
  if (!tier) notFound();
  const people = listTier(getDb(), tier.value);
  return (
    <Panel close={{ href: "/people", label: "Close" }}>
      <BackLink href="/people" label="Back to people" />
      <h1 className="mt-6 text-[1.75rem] font-medium desk:mt-0 desk:text-2xl">{tier.plural}</h1>
      <p className="mt-1 text-[0.8125rem] text-muted">
        {people.length} {people.length === 1 ? "person" : "people"}
      </p>
      <ul className="mt-6 flex flex-col">
        {people.map((p) => {
          const color = personColor(p.color);
          return (
            <li key={p.id}>
              <Link
                href={`/people/${p.id}`}
                className="-mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface/70 focus-visible:bg-surface/70 focus-visible:outline-none"
              >
                <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-sm ring-2 ring-halo ${color.fill} ${color.ink}`}>
                  {initials(p.name)}
                  <EmojiBadge emoji={p.emoji} />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-[0.9375rem]">{p.name}</span>
                  <span className="text-xs text-muted">{p.lastMoment ? `Last moment ${dayLabel(p.lastMoment)}` : "No moments yet"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export default function TierPage(props: PageProps<"/people/tiers/[tier]">) {
  return (
    <Suspense>
      <TierList params={props.params} />
    </Suspense>
  );
}
