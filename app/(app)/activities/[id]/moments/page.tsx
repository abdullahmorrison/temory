import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { MomentItem } from "@/components/moment-item";
import { Panel } from "@/components/panel";
import { SectionLabel } from "@/components/section-label";
import { getDb } from "@/lib/db";
import { groupByMonth, listMoments } from "@/lib/moments";
import { activityFromParams, countLabel } from "../data";

async function Timeline({ params }: { params: Promise<{ id: string }> }) {
  const activity = await activityFromParams(params);
  const moments = listMoments(getDb(), { activityId: activity.id });
  return (
    <Panel close={{ href: "/activities", label: "Close" }}>
      <BackLink href={`/activities/${activity.id}`} label={`Back to ${activity.name}`} everywhere />
      <h1 className="mt-6 text-[1.75rem] font-medium desk:text-2xl">{activity.name}</h1>
      <p className="mt-1 text-[0.8125rem] text-muted">{countLabel(activity.people.length, moments.length)}</p>
      {groupByMonth(moments).map((month) => (
        <section key={month.key} className="mt-9 flex flex-col gap-2">
          <SectionLabel>{month.label}</SectionLabel>
          <div className="flex flex-col gap-1">
            {month.moments.map((m) => (
              <MomentItem key={m.id} moment={m} about={{ activity: activity.id }} href={`/activities/${activity.id}/moments/${m.id}?from=all`} />
            ))}
          </div>
        </section>
      ))}
    </Panel>
  );
}

export default function ActivityMomentsPage(props: PageProps<"/activities/[id]/moments">) {
  return (
    <Suspense>
      <Timeline params={props.params} />
    </Suspense>
  );
}
