import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityBadge } from "@/components/activity-icon";
import { BackLink } from "@/components/back-link";
import { EmojiBadge } from "@/components/emoji-badge";
import { Panel } from "@/components/panel";
import { MomentItem } from "@/components/moment-item";
import { SectionLabel } from "@/components/section-label";
import { getDb } from "@/lib/db";
import { listMoments } from "@/lib/moments";
import { initials } from "@/lib/names";
import { personColor } from "@/lib/person-colors";
import { tierLabel } from "@/lib/tiers";
import { activityFromParams, countLabel } from "./data";
import { ActivityStatusSwitch } from "./status";

const LATEST = 3; // moments shown on the page before "All N moments"

async function Activity({ params }: { params: Promise<{ id: string }> }) {
  const activity = await activityFromParams(params);
  const edit = `/activities/${activity.id}/edit`;
  const moments = listMoments(getDb(), { activityId: activity.id });
  return (
    <Panel close={{ href: "/activities", label: "Close" }}>
      <div className="flex items-center justify-between desk:-ml-3 desk:pr-10">
        <BackLink href="/activities" label="Back to activities" />
        <Link href={edit} className="rounded-full px-3 py-1 text-sm text-muted transition-colors hover:bg-surface hover:text-ink">
          Edit
        </Link>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <ActivityBadge icon={activity.icon} size="lg" />
        <div className="min-w-0">
          <h1 className="text-[1.75rem] font-medium desk:text-2xl">{activity.name}</h1>
          <p className="text-[0.8125rem] text-muted">{countLabel(activity.people.length, moments.length)}</p>
        </div>
      </div>

      <div className="mt-6">
        <ActivityStatusSwitch id={activity.id} status={activity.status} />
      </div>

      {activity.status === "want" && (
        <section className="mt-8 flex flex-col gap-2.5">
          <SectionLabel>What&apos;s in the way</SectionLabel>
          {activity.inTheWay ? (
            <p className="font-serif text-[1.0625rem]">{activity.inTheWay}</p>
          ) : (
            <Link href={edit} className="font-serif text-[1.0625rem] text-muted/70 hover:text-muted">
              Add what&apos;s keeping you from it…
            </Link>
          )}
        </section>
      )}

      <section className="mt-8 flex flex-col gap-2.5">
        <SectionLabel>With</SectionLabel>
        <ul className="flex flex-col">
          {activity.people.map((p) => {
            const c = personColor(p.color);
            return (
              <li key={p.id}>
                <Link href={`/people/${p.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface/60">
                  <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-full font-serif text-[0.9375rem] ring-2 ring-halo ${c.fill} ${c.ink}`}>
                    {initials(p.name)}
                    <EmojiBadge emoji={p.emoji} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[0.9375rem]">{p.name}</span>
                    <span className="text-xs text-muted">{tierLabel(p.closeness)}</span>
                  </span>
                  <ChevronRight size="1.125rem" className="shrink-0 text-muted" />
                </Link>
              </li>
            );
          })}
        </ul>
        <Link href={edit} className="flex items-center gap-0.5 self-start text-[0.8125rem] text-accent hover:underline">
          <Plus size="0.8125rem" />
          someone
        </Link>
      </section>

      <section className="mt-10 flex flex-col gap-2.5">
        <SectionLabel>Notes</SectionLabel>
        {activity.notes ? (
          <p className="font-serif text-[1.0625rem] leading-[1.6875rem] whitespace-pre-line">{activity.notes}</p>
        ) : (
          <Link href={edit} className="font-serif text-[1.0625rem] text-muted/70 hover:text-muted">
            Add notes about {activity.name}…
          </Link>
        )}
      </section>

      <section className="mt-10 flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <SectionLabel>Journal</SectionLabel>
          {moments.length > LATEST && (
            <Link href={`/activities/${activity.id}/moments`} className="text-xs text-accent underline-offset-4 hover:underline">
              All {moments.length} moments
            </Link>
          )}
        </div>
        {moments.length ? (
          <div className="flex flex-col gap-1">
            {moments.slice(0, LATEST).map((m) => (
              <MomentItem key={m.id} moment={m} about={{ activity: activity.id }} href={`/activities/${activity.id}/moments/${m.id}`} />
            ))}
          </div>
        ) : (
          <Link href="/write" className="font-serif text-[1.0625rem] text-muted/70 hover:text-muted">
            No {activity.name} moments yet. Write one…
          </Link>
        )}
      </section>
    </Panel>
  );
}

export default function ActivityPage(props: PageProps<"/activities/[id]">) {
  return (
    <Suspense>
      <Activity params={props.params} />
    </Suspense>
  );
}
