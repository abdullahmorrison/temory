import { notFound } from "next/navigation";
import { Suspense } from "react";
import { editMoment, removeMoment } from "@/app/(app)/journal/actions";
import { activitiesForPicker, peopleForPicker } from "@/app/(app)/journal/data";
import { ConfirmDelete } from "@/components/confirm-delete";
import { MomentForm } from "@/components/moment-form";
import { getDb } from "@/lib/db";
import { formDefaults, getMoment } from "@/lib/moments";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const people = await peopleForPicker(); // also waits for the request, before reading the moment
  const id = Number((await params).id);
  const moment = Number.isInteger(id) ? getMoment(getDb(), id) : undefined;
  if (!moment) notFound();
  const defaults = formDefaults(moment);
  return (
    <>
      {/* Keyed by what's saved: Next keeps a left page alive with its state, so a reopened form would hold the values from before. */}
      <MomentForm
        key={JSON.stringify(defaults)}
        action={editMoment.bind(null, moment.id, "/journal")}
        people={people}
        activities={await activitiesForPicker()}
        closeHref="/journal"
        defaults={defaults}
      />
      <div className="mt-14 border-t border-line pt-6">
        <ConfirmDelete label="Delete this moment" warning="Delete this moment? This can't be undone." action={removeMoment.bind(null, moment.id, "/journal")} />
      </div>
    </>
  );
}

export default function EditMomentPage(props: PageProps<"/journal/[id]/edit">) {
  return (
    <div className="mx-auto max-w-xl px-7 pt-12 pb-10 desk:pt-8">
      <Suspense>
        <Edit params={props.params} />
      </Suspense>
    </div>
  );
}
