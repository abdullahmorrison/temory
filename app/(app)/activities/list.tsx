import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { ActivityBadge } from "@/components/activity-icon";
import { Faces } from "@/components/faces";
import { SectionLabel } from "@/components/section-label";
import { listActivities } from "@/lib/activities";
import { getDb } from "@/lib/db";
import { firstName } from "@/lib/names";
import { RowLink } from "./row-link";

const NAMED = 3; // people named on a row before "+ N"

/** "Sam, Jordan, Priya + 1" */
function names(people: { name: string }[]) {
  const shown = people.slice(0, NAMED).map((p) => firstName(p.name)).join(", ");
  return people.length > NAMED ? `${shown} + ${people.length - NAMED}` : shown;
}

type Activity = ReturnType<typeof listActivities>[number];

/** Every activity: what you do now, then what you'd like to (faded), then what's behind you (folded away). */
export async function ActivityList() {
  await connection(); // read the database per request, not at build time
  const activities = listActivities(getDb());
  const doing = activities.filter((a) => a.status === "doing");
  const want = activities.filter((a) => a.status === "want");
  const past = activities.filter((a) => a.status === "past");
  return (
    <div className="mx-auto max-w-xl px-7 pt-14 pb-10 desk:px-10 desk:pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium desk:text-[1.75rem]">Activities</h1>
          <p className="mt-1 text-[0.8125rem] text-muted">
            {activities.length === 0 ? "0 activities" : `${doing.length} doing`}
            {doing.length > 1 && " · most moments first"}
          </p>
        </div>
        <Link
          href="/activities/new"
          aria-label="Add activity"
          className="flex items-center gap-1.5 rounded-full border border-line p-2.5 text-ink transition-colors hover:bg-surface desk:px-3.5 desk:py-2 desk:text-[0.8125rem] desk:font-medium"
        >
          <Plus size="1.125rem" className="desk:size-4" />
          <span className="hidden desk:inline">Add activity</span>
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="mt-40 text-center desk:mt-24">
          <p className="font-serif text-[1.375rem]">Nothing here yet.</p>
          <p className="mt-1.5 text-[0.8125rem] text-muted">Pickleball, game nights, long walks: add the things you do with people.</p>
          <Link href="/activities/new" className="mt-2 inline-block text-[0.8125rem] font-medium text-accent underline-offset-4 hover:underline">
            Add your first activity
          </Link>
        </div>
      ) : (
        <>
          <Rows activities={doing} className="mt-6" />
          {want.length > 0 && (
            <section className="mt-9">
              <SectionLabel>Want to · {want.length}</SectionLabel>
              <Rows activities={want} className="mt-3" />
            </section>
          )}
          {past.length > 0 && (
            <details className="group mt-6 border-t border-line pt-5">
              <summary className="flex cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden">
                <SectionLabel as="span">Past · {past.length}</SectionLabel>
                <ChevronDown size="1.125rem" className="text-muted transition-transform group-open:rotate-180" />
              </summary>
              <Rows activities={past} className="mt-3" />
            </details>
          )}
        </>
      )}
    </div>
  );
}

function Rows({ activities, className }: { activities: Activity[]; className: string }) {
  if (!activities.length) return null;
  return (
    <ul className={`flex flex-col gap-1 desk:-mx-3 ${className}`}>
      {activities.map((a) => (
        <li key={a.id}>
          <Row activity={a} />
        </li>
      ))}
    </ul>
  );
}

const momentCount = (n: number) => `${n} ${n === 1 ? "moment" : "moments"}`;

/** Who it's with. Want to and Past are faded. */
function Row({ activity: a }: { activity: Activity }) {
  const faded = a.status !== "doing";
  return (
    <RowLink href={`/activities/${a.id}`}>
      <span className={faded ? "opacity-55" : ""}>
        <ActivityBadge icon={a.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-[1.0625rem] font-medium ${faded ? "text-muted" : ""}`}>{a.name}</span>
          {(a.moments > 0 || !faded) && <span className="shrink-0 text-xs text-muted">{momentCount(a.moments)}</span>}
        </span>
        {a.people.length > 0 ? (
          <span className={`flex items-center gap-2 text-[0.8125rem] text-muted ${faded ? "opacity-70" : ""}`}>
            <Faces people={a.people} />
            <span className="truncate">{names(a.people)}</span>
          </span>
        ) : (
          <span className="text-[0.8125rem] text-muted">No one yet</span>
        )}
      </span>
      <ChevronRight size="1.125rem" className="shrink-0 text-muted" />
    </RowLink>
  );
}
