import { connection } from "next/server";
import { Suspense } from "react";
import { addActivity } from "@/app/(app)/activities/actions";
import { ActivityForm } from "@/components/activity-form";
import { BackLink } from "@/components/back-link";
import { Panel } from "@/components/panel";
import { signedIn } from "@/lib/session";
import { listPeople } from "@/lib/people";

async function Form() {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  return <ActivityForm action={addActivity} people={listPeople(my)} submitLabel="Add activity" />;
}

export default function NewActivityPage() {
  return (
    <Panel close={{ href: "/activities", label: "Close" }}>
      <BackLink href="/activities" label="Back to activities" />
      <h1 className="mt-6 mb-10 pr-10 text-2xl font-medium desk:mt-0 desk:mb-9 desk:text-[1.375rem]">Add an activity</h1>
      <Suspense>
        <Form />
      </Suspense>
    </Panel>
  );
}
