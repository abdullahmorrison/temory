import { desc, eq, inArray } from "drizzle-orm";
import { activities, entries, entryActivities, entryPeople, people } from "@/db/schema";
import type { Db } from "@/lib/db";
import { dayHeading, isDate, isTime, monthLabel } from "@/lib/dates";
import { mentionedActivityIds, mentionedIds } from "@/lib/mentions";

// viaMention: those in personIds who are there only because the text mentions them; the same for activities.
export type MomentInput = {
  body: string;
  date: string;
  time?: string; // HH:MM, or empty when unknown
  personIds: number[];
  viaMention?: number[];
  activityIds?: number[];
  activityViaMention?: number[];
};
export type Moment = Awaited<ReturnType<typeof listMoments>>[number];

/** Trims and checks what the user wrote; throws a message fit to show them. */
function clean(db: Db, input: MomentInput) {
  const body = input.body.trim();
  if (!body) throw new Error("Write something about the moment.");
  if (!isDate(input.date)) throw new Error("Pick a date for the moment.");
  const time = input.time || null;
  if (time && !isTime(time)) throw new Error("Pick a time for the moment, or leave it empty.");
  const personIds = [...new Set(input.personIds)];
  if (personIds.length) {
    const found = db.select({ id: people.id }).from(people).where(inArray(people.id, personIds)).all();
    if (found.length !== personIds.length) throw new Error("Someone you tagged no longer exists.");
  }
  const viaMention = (input.viaMention ?? []).filter((id) => personIds.includes(id));
  const activityIds = [...new Set(input.activityIds ?? [])];
  if (activityIds.length) {
    const found = db.select({ id: activities.id }).from(activities).where(inArray(activities.id, activityIds)).all();
    if (found.length !== activityIds.length) throw new Error("An activity you picked no longer exists.");
  }
  const activityViaMention = (input.activityViaMention ?? []).filter((id) => activityIds.includes(id));
  return { values: { body, date: input.date, time }, links: { personIds, viaMention, activityIds, activityViaMention } };
}

type Links = ReturnType<typeof clean>["links"];

function link(db: Pick<Db, "insert">, entryId: number, { personIds, viaMention, activityIds, activityViaMention }: Links) {
  if (personIds.length)
    db.insert(entryPeople)
      .values(personIds.map((personId) => ({ entryId, personId, viaMention: viaMention.includes(personId) })))
      .run();
  if (activityIds.length)
    db.insert(entryActivities)
      .values(activityIds.map((activityId) => ({ entryId, activityId, viaMention: activityViaMention.includes(activityId) })))
      .run();
}

export function createMoment(db: Db, input: MomentInput) {
  const { values, links } = clean(db, input);
  return db.transaction((tx) => {
    const entry = tx.insert(entries).values(values).returning().get();
    link(tx, entry.id, links);
    return entry;
  });
}

export function updateMoment(db: Db, id: number, input: MomentInput) {
  const { values, links } = clean(db, input);
  return db.transaction((tx) => {
    const entry = tx.update(entries).set(values).where(eq(entries.id, id)).returning().get();
    if (!entry) throw new Error("This moment no longer exists.");
    tx.delete(entryPeople).where(eq(entryPeople.entryId, id)).run();
    tx.delete(entryActivities).where(eq(entryActivities.entryId, id)).run();
    link(tx, id, links);
    return entry;
  });
}

export function deleteMoment(db: Db, id: number) {
  db.delete(entries).where(eq(entries.id, id)).run(); // links go with it (cascade)
}

/**
 * Every moment, newest first (on a day, those without a time come after the timed ones), with the people and activities in it, and everyone and everything its
 * text mentions (which may not be in it any more). Narrow it to one moment, or to one person's or activity's moments.
 */
export function listMoments(db: Db, where?: { id?: number; personId?: number; activityId?: number }) {
  const withPerson = (personId: number) =>
    inArray(entries.id, db.select({ id: entryPeople.entryId }).from(entryPeople).where(eq(entryPeople.personId, personId)));
  const withActivity = (activityId: number) =>
    inArray(entries.id, db.select({ id: entryActivities.entryId }).from(entryActivities).where(eq(entryActivities.activityId, activityId)));
  const rows = db
    .select()
    .from(entries)
    .where(where?.id ? eq(entries.id, where.id) : where?.personId ? withPerson(where.personId) : where?.activityId ? withActivity(where.activityId) : undefined)
    .orderBy(desc(entries.date), desc(entries.time), desc(entries.id)) // SQLite sorts empty times last when descending
    .all();
  const links = rows.length
    ? db
        .select({ entryId: entryPeople.entryId, id: people.id, name: people.name, color: people.color, viaMention: entryPeople.viaMention })
        .from(entryPeople)
        .innerJoin(people, eq(people.id, entryPeople.personId))
        .where(
          inArray(
            entryPeople.entryId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(people.name)
        .all()
    : [];
  const doing = rows.length
    ? db
        .select({ entryId: entryActivities.entryId, id: activities.id, name: activities.name, icon: activities.icon, viaMention: entryActivities.viaMention })
        .from(entryActivities)
        .innerJoin(activities, eq(activities.id, entryActivities.activityId))
        .where(
          inArray(
            entryActivities.entryId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(activities.name)
        .all()
    : [];
  const mentionIds = [...new Set(rows.flatMap((r) => mentionedIds(r.body)))];
  const mentionable = mentionIds.length
    ? db.select({ id: people.id, name: people.name, color: people.color }).from(people).where(inArray(people.id, mentionIds)).all()
    : [];
  const activityIds = [...new Set(rows.flatMap((r) => mentionedActivityIds(r.body)))];
  const nameable = activityIds.length
    ? db.select({ id: activities.id, name: activities.name }).from(activities).where(inArray(activities.id, activityIds)).all()
    : [];
  return rows.map((r) => {
    const ids = mentionedIds(r.body);
    const named = mentionedActivityIds(r.body);
    return {
      id: r.id,
      body: r.body,
      date: r.date,
      time: r.time ?? "",
      people: links.filter((l) => l.entryId === r.id).map(({ id, name, color, viaMention }) => ({ id, name, color, viaMention })),
      activities: doing.filter((a) => a.entryId === r.id).map(({ id, name, icon, viaMention }) => ({ id, name, icon, viaMention })),
      mentioned: mentionable.filter((p) => ids.includes(p.id)),
      mentionedActivities: nameable.filter((a) => named.includes(a.id)),
    };
  });
}

export function getMoment(db: Db, id: number) {
  return listMoments(db, { id })[0];
}

/** A saved moment as the form's starting values. */
export function formDefaults(moment: Moment) {
  return {
    body: moment.body,
    date: moment.date,
    time: moment.time,
    personIds: moment.people.map((p) => p.id),
    viaMention: moment.people.filter((p) => p.viaMention).map((p) => p.id),
    activityIds: moment.activities.map((a) => a.id),
    activityViaMention: moment.activities.filter((a) => a.viaMention).map((a) => a.id),
  };
}

// Groups a newest-first list by `key`, keeping order: [{ key, label, moments }].
function groupBy<T extends { date: string }>(moments: T[], key: (date: string) => string, label: (date: string) => string) {
  const groups: { key: string; label: string; moments: T[] }[] = [];
  for (const m of moments) {
    if (groups.at(-1)?.key !== key(m.date)) groups.push({ key: key(m.date), label: label(m.date), moments: [] });
    groups.at(-1)!.moments.push(m);
  }
  return groups;
}

/** Groups a newest-first list into days: [{ label: "Thursday, Oct 22", moments }]. */
export const groupByDay = <T extends { date: string }>(moments: T[]) => groupBy(moments, (d) => d, dayHeading);

/** Groups a newest-first list into months: [{ label: "October 2026", moments }]. */
export const groupByMonth = <T extends { date: string }>(moments: T[]) => groupBy(moments, (d) => d.slice(0, 7), monthLabel);
