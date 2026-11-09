import { and, asc, count, eq, inArray } from "drizzle-orm";
import { activities, activityPeople, entryActivities, people, relationshipTypes } from "@/db/schema";
import { isActivityIcon } from "@/lib/activity-icons";
import { ACTIVITY_STATUSES, isActivityStatus } from "@/lib/activity-status";
import type { Db, UserDb } from "@/lib/db";
import { personEmoji, withType } from "@/lib/people";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

type ActivityInput = { name: string; icon: string; status?: string; notes?: string; personIds?: number[] };

/** Trims and checks what the user typed; throws a message fit to show them. */
function clean({ db, userId }: UserDb, input: ActivityInput) {
  const name = input.name.trim();
  if (!name) throw new Error("An activity needs a name.");
  if (!isActivityIcon(input.icon)) throw new Error(`Unknown icon: ${input.icon}`);
  const status = input.status ?? "doing";
  if (!isActivityStatus(status)) throw new Error(`Unknown status: ${status}`);
  const personIds = [...new Set(input.personIds ?? [])];
  if (personIds.length) {
    const found = db.select({ id: people.id }).from(people).where(and(eq(people.userId, userId), inArray(people.id, personIds))).all();
    if (found.length !== personIds.length) throw new Error("Someone you added no longer exists.");
  }
  return { values: { name, icon: input.icon, status, notes: (input.notes ?? "").trim() }, personIds };
}

function setPeople(db: Tx, activityId: number, personIds: number[]) {
  db.delete(activityPeople).where(eq(activityPeople.activityId, activityId)).run();
  if (personIds.length) db.insert(activityPeople).values(personIds.map((personId) => ({ activityId, personId }))).run();
}

/** One of your activities, by id. */
const yourActivity = (userId: number, id: number) => and(eq(activities.id, id), eq(activities.userId, userId));

export function createActivity(my: UserDb, input: ActivityInput) {
  const { values, personIds } = clean(my, input);
  return my.db.transaction((tx) => {
    const created = tx
      .insert(activities)
      .values({ ...values, userId: my.userId })
      .returning()
      .get();
    setPeople(tx, created.id, personIds);
    return created;
  });
}

/** Changes name, icon, where it is in your life, notes, and who it's with. */
export function updateActivity(my: UserDb, id: number, input: ActivityInput) {
  const { values, personIds } = clean(my, input);
  return my.db.transaction((tx) => {
    const updated = tx.update(activities).set(values).where(yourActivity(my.userId, id)).returning().get();
    if (!updated) throw new Error("This activity no longer exists.");
    setPeople(tx, id, personIds);
    return updated;
  });
}

/** Moves an activity to Doing, Want to, or Past. */
export function setActivityStatus({ db, userId }: UserDb, id: number, status: string) {
  if (!isActivityStatus(status)) throw new Error(`Unknown status: ${status}`);
  const updated = db.update(activities).set({ status }).where(yourActivity(userId, id)).returning().get();
  if (!updated) throw new Error("This activity no longer exists.");
}

/** Counts Want to activities as ones you do now, as when you log a moment doing them. Others stay as they are. */
export function startDoing({ db, userId }: UserDb, ids: number[]) {
  if (ids.length)
    db.update(activities)
      .set({ status: "doing" })
      .where(and(eq(activities.userId, userId), inArray(activities.id, ids), eq(activities.status, "want")))
      .run();
}

/** Removes the activity. The people stay. */
export function deleteActivity({ db, userId }: UserDb, id: number) {
  db.delete(activities).where(yourActivity(userId, id)).run();
}

/** Who each activity is with, closest first. */
function peopleFor(db: Db, activityIds: number[]) {
  const byActivity = new Map<number, { id: number; name: string; color: number; emoji: string; closeness: number }[]>();
  if (!activityIds.length) return byActivity;
  const rows = db
    .select({ activityId: activityPeople.activityId, id: people.id, name: people.name, color: people.color, emoji: personEmoji, closeness: people.closeness })
    .from(activityPeople)
    .innerJoin(people, eq(people.id, activityPeople.personId))
    .leftJoin(relationshipTypes, withType)
    .where(inArray(activityPeople.activityId, activityIds))
    .orderBy(asc(people.closeness), asc(people.name))
    .all();
  for (const { activityId, ...person } of rows) byActivity.set(activityId, [...(byActivity.get(activityId) ?? []), person]);
  return byActivity;
}

export function getActivity({ db, userId }: UserDb, id: number) {
  const activity = db.select().from(activities).where(yourActivity(userId, id)).get();
  if (!activity) return undefined;
  return { ...activity, people: peopleFor(db, [id]).get(id) ?? [] };
}

/**
 * Every activity with its people and how many moments it's in: Doing, then Want to, then Past; within
 * each, the ones in the most moments first, then the ones done with the most people, then A to Z.
 */
export function listActivities({ db, userId }: UserDb) {
  const rows = db
    .select({ id: activities.id, name: activities.name, icon: activities.icon, status: activities.status, moments: count(entryActivities.entryId) })
    .from(activities)
    .leftJoin(entryActivities, eq(entryActivities.activityId, activities.id))
    .where(eq(activities.userId, userId))
    .groupBy(activities.id)
    .all();
  const withPeople = peopleFor(db, rows.map((r) => r.id));
  return rows
    .map((r) => ({ ...r, people: withPeople.get(r.id) ?? [] }))
    .sort((a, b) => ACTIVITY_STATUSES.indexOf(a.status) - ACTIVITY_STATUSES.indexOf(b.status) || b.moments - a.moments || b.people.length - a.people.length || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}
