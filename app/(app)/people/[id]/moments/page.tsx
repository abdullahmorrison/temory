import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { MomentItem } from "@/components/moment-item";
import { Panel } from "@/components/panel";
import { SectionLabel } from "@/components/section-label";
import { getDb } from "@/lib/db";
import { groupByMonth, listMoments } from "@/lib/moments";
import { tierLabel } from "@/lib/tiers";
import { personFromParams } from "../data";

async function Timeline({ params }: { params: Promise<{ id: string }> }) {
  const person = await personFromParams(params);
  const moments = listMoments(getDb(), { personId: person.id });
  return (
    <Panel close={{ href: "/people", label: "Close" }}>
      <BackLink href={`/people/${person.id}`} label={`Back to ${person.name}`} everywhere />
      <h1 className="mt-6 text-[1.75rem] font-medium desk:text-2xl">{person.name}</h1>
      <p className="mt-1 text-[0.8125rem] text-muted">
        {tierLabel(person.closeness)} · {moments.length} {moments.length === 1 ? "moment" : "moments"}
      </p>
      {groupByMonth(moments).map((month) => (
        <section key={month.key} className="mt-9 flex flex-col gap-2">
          <SectionLabel>{month.label}</SectionLabel>
          <div className="flex flex-col gap-1">
            {month.moments.map((m) => (
              <MomentItem key={m.id} moment={m} about={{ person: person.id }} href={`/people/${person.id}/moments/${m.id}?from=all`} />
            ))}
          </div>
        </section>
      ))}
    </Panel>
  );
}

export default function PersonMomentsPage(props: PageProps<"/people/[id]/moments">) {
  return (
    <Suspense>
      <Timeline params={props.params} />
    </Suspense>
  );
}
