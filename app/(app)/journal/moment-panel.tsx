import { notFound } from "next/navigation";
import { editMoment, removeMoment } from "@/app/(app)/journal/actions";
import { activitiesForPicker, peopleForPicker } from "@/app/(app)/journal/data";
import { ConfirmDelete } from "@/components/confirm-delete";
import { MomentForm } from "@/components/moment-form";
import { Panel } from "@/components/panel";
import { getDb } from "@/lib/db";
import { formDefaults, getMoment } from "@/lib/moments";

/** A moment opened from a person's or an activity's page, edited in their panel. Closing or saving goes `back`. */
export async function MomentPanel({ momentId, back }: { momentId: string; back: string }) {
  const id = Number(momentId);
  const moment = Number.isInteger(id) ? getMoment(getDb(), id) : undefined;
  if (!moment) notFound();
  return (
    <Panel>
      <MomentForm
        action={editMoment.bind(null, moment.id, back)}
        people={await peopleForPicker()}
        activities={await activitiesForPicker()}
        closeHref={back}
        defaults={formDefaults(moment)}
      />
      <div className="mt-14 border-t border-line pt-6">
        <ConfirmDelete label="Delete this moment" warning="Delete this moment? This can't be undone." action={removeMoment.bind(null, moment.id, back)} />
      </div>
    </Panel>
  );
}
