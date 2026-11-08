import { Suspense } from "react";
import { MomentPanel } from "@/app/(app)/journal/moment-panel";
import { activityFromParams } from "../../data";

// A moment opened from an activity's page or timeline. Closing or saving goes back there.
async function Edit({ params, searchParams }: PageProps<"/activities/[id]/moments/[momentId]">) {
  const activity = await activityFromParams(params);
  const back = (await searchParams).from === "all" ? `/activities/${activity.id}/moments` : `/activities/${activity.id}`;
  return <MomentPanel momentId={(await params).momentId} back={back} />;
}

export default function ActivityMomentPage(props: PageProps<"/activities/[id]/moments/[momentId]">) {
  return (
    <Suspense>
      <Edit {...props} />
    </Suspense>
  );
}
