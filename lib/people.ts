import { and, count, desc, eq, getTableColumns, max, sql } from "drizzle-orm";
import { entries, entryPeople, people, relationshipTypes } from "@/db/schema";
import type { UserDb } from "@/lib/db";
import { nextColor } from "@/lib/person-colors";
import { listTypes } from "@/lib/relationship-types";
import { NEW_PERSON_CLOSENESS, TIERS } from "@/lib/tiers";

type PersonInput = { name: string; closeness?: number; typeId?: number | null; notes?: string };

/** One of your people, by id. */
export const yourPerson = (userId: number, id: number) => and(eq(people.id, id), eq(people.userId, userId));

/** Trims and checks what the user typed; throws a message fit to show them. */
function clean(my: UserDb, input: PersonInput) {
  const name = input.name.trim();
  if (!name) throw new Error("A person needs a name.");
  const closeness = input.closeness ?? NEW_PERSON_CLOSENESS;
  if (!TIERS.some((t) => t.value === closeness)) throw new Error(`Unknown closeness: ${closeness}`);
  const typeId = input.typeId ?? null;
  if (typeId !== null && !listTypes(my).some((t) => t.id === typeId)) throw new Error("That relationship type no longer exists.");
  return { name, closeness, typeId, notes: (input.notes ?? "").trim() };
}

/** The color the next person you add will get. */
export function nextPersonColor({ db, userId }: UserDb) {
  const usage = db.select({ color: people.color, n: count() }).from(people).where(eq(people.userId, userId)).groupBy(people.color).all();
  return nextColor(new Map(usage.map((r) => [r.color, r.n])));
}

export function createPerson(my: UserDb, input: PersonInput) {
  const values = clean(my, input);
  return my.db
    .insert(people)
    .values({ ...values, userId: my.userId, color: nextPersonColor(my) })
    .returning()
    .get();
}

/** Changes name, closeness, relationship type, and notes. Color stays, so the person stays recognizable. */
export function updatePerson(my: UserDb, id: number, input: PersonInput) {
  const updated = my.db.update(people).set(clean(my, input)).where(yourPerson(my.userId, id)).returning().get();
  if (!updated) throw new Error("This person no longer exists.");
  return updated;
}

/** Moves a person to another closeness tier, keeping everything else. */
export function moveToTier({ db, userId }: UserDb, id: number, closeness: number) {
  if (!TIERS.some((t) => t.value === closeness)) throw new Error(`Unknown closeness: ${closeness}`);
  const moved = db.update(people).set({ closeness }).where(yourPerson(userId, id)).returning().get();
  if (!moved) throw new Error("This person no longer exists.");
  return moved;
}

/** Removes the person. Moments stay; they just no longer list this person. */
export function deletePerson({ db, userId }: UserDb, id: number) {
  db.delete(people).where(yourPerson(userId, id)).run();
}

/** A person's badge: the emoji of their relationship type, or "" without one. Needs `withType`. */
export const personEmoji = sql<string>`coalesce(${relationshipTypes.emoji}, '')`;
export const withType = eq(relationshipTypes.id, people.typeId);

export function getPerson({ db, userId }: UserDb, id: number) {
  return db
    .select({ ...getTableColumns(people), emoji: personEmoji })
    .from(people)
    .leftJoin(relationshipTypes, withType)
    .where(yourPerson(userId, id))
    .get();
}

// Those in the most moments first; on a tie, whoever's latest moment is newest (by day, then time), then A to Z.
const latest = sql`max(${entries.date} || ' ' || coalesce(${entries.time}, ''))`;
const byMoments = [desc(count(entryPeople.entryId)), desc(latest), sql`${people.name} collate nocase`];

/** Everyone, those in the most moments first, then the most recent. */
export function listPeople({ db, userId }: UserDb) {
  return db
    .select({ id: people.id, name: people.name, closeness: people.closeness, color: people.color, emoji: personEmoji })
    .from(people)
    .leftJoin(relationshipTypes, withType)
    .leftJoin(entryPeople, eq(entryPeople.personId, people.id))
    .leftJoin(entries, eq(entries.id, entryPeople.entryId))
    .where(eq(people.userId, userId))
    .groupBy(people.id)
    .orderBy(...byMoments)
    .all();
}

/** Everyone in a tier with the date of their latest moment, in the same order as the arcs. */
export function listTier({ db, userId }: UserDb, closeness: number) {
  return db
    .select({ id: people.id, name: people.name, color: people.color, emoji: personEmoji, lastMoment: max(entries.date) })
    .from(people)
    .leftJoin(relationshipTypes, withType)
    .leftJoin(entryPeople, eq(entryPeople.personId, people.id))
    .leftJoin(entries, eq(entries.id, entryPeople.entryId))
    .where(and(eq(people.userId, userId), eq(people.closeness, closeness)))
    .groupBy(people.id)
    .orderBy(...byMoments)
    .all();
}
