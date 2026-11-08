import { Suspense } from "react";
import { MomentPanel } from "@/app/(app)/journal/moment-panel";
import { personFromParams } from "../../data";

// A moment opened from a person's profile or timeline. Closing or saving goes back there.
async function Edit({ params, searchParams }: PageProps<"/people/[id]/moments/[momentId]">) {
  const person = await personFromParams(params);
  const back = (await searchParams).from === "all" ? `/people/${person.id}/moments` : `/people/${person.id}`;
  return <MomentPanel momentId={(await params).momentId} back={back} />;
}

export default function PersonMomentPage(props: PageProps<"/people/[id]/moments/[momentId]">) {
  return (
    <Suspense>
      <Edit {...props} />
    </Suspense>
  );
}
