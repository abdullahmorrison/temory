import { Suspense } from "react";
import { editActivity, removeActivity } from "@/app/(app)/activities/actions";
import { ActivityForm } from "@/components/activity-form";
import { BackLink } from "@/components/back-link";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Panel } from "@/components/panel";
import { getDb } from "@/lib/db";
import { listPeople } from "@/lib/people";
import { activityFromParams } from "../data";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const activity = await activityFromParams(params);
  const back = `/activities/${activity.id}`;
  const defaults = { ...activity, personIds: activity.people.map((p) => p.id) };
  return (
    <Panel close={{ href: back, label: `Back to ${activity.name}` }}>
      <BackLink href={back} label={`Back to ${activity.name}`} />
      <h1 className="mt-6 mb-10 pr-10 text-2xl font-medium desk:mt-0 desk:mb-9 desk:text-[1.375rem]">Edit {activity.name}</h1>
      {/* Keyed by what's saved: Next keeps a left page alive with its state, so a reopened form would hold the values from before. */}
      <ActivityForm
        key={JSON.stringify(defaults)}
        action={editActivity.bind(null, activity.id)}
        people={listPeople(getDb())}
        submitLabel="Save"
        defaults={defaults}
      />
      <div className="mt-14 border-t border-line pt-6">
        <ConfirmDelete
          label={`Delete ${activity.name}`}
          warning={`Delete ${activity.name}? The people stay.`}
          action={removeActivity.bind(null, activity.id)}
        />
      </div>
    </Panel>
  );
}

export default function EditActivityPage(props: PageProps<"/activities/[id]/edit">) {
  return (
    <Suspense>
      <Edit params={props.params} />
    </Suspense>
  );
}
