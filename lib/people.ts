import { count, desc, eq, max, sql } from "drizzle-orm";
import { entries, entryPeople, people } from "@/db/schema";
import type { Db } from "@/lib/db";
import { isOneEmoji } from "@/lib/emoji";
import { nextColor } from "@/lib/person-colors";
import { NEW_PERSON_CLOSENESS, TIERS } from "@/lib/tiers";

type PersonInput = { name: string; closeness?: number; emoji?: string; notes?: string };


/** Trims and checks what the user typed; throws a message fit to show them. */
function clean(input: PersonInput) {
  const name = input.name.trim();
  if (!name) throw new Error("A person needs a name.");
  const closeness = input.closeness ?? NEW_PERSON_CLOSENESS;
  if (!TIERS.some((t) => t.value === closeness)) throw new Error(`Unknown closeness: ${closeness}`);
  const emoji = (input.emoji ?? "").trim();
  if (emoji && !isOneEmoji(emoji)) throw new Error("Pick a single emoji.");
  return { name, closeness, emoji, notes: (input.notes ?? "").trim() };
}

/** The color the next person added will get. */
export function nextPersonColor(db: Db) {
  const usage = db.select({ color: people.color, n: count() }).from(people).groupBy(people.color).all();
  return nextColor(new Map(usage.map((r) => [r.color, r.n])));
}

export function createPerson(db: Db, input: PersonInput) {
  const values = clean(input);
  return db
    .insert(people)
    .values({ ...values, color: nextPersonColor(db) })
    .returning()
    .get();
}

/** Changes name, closeness, emoji, and notes. Color stays, so the person stays recognizable. */
export function updatePerson(db: Db, id: number, input: PersonInput) {
  const updated = db.update(people).set(clean(input)).where(eq(people.id, id)).returning().get();
  if (!updated) throw new Error("This person no longer exists.");
  return updated;
}

/** Moves a person to another closeness tier, keeping everything else. */
export function moveToTier(db: Db, id: number, closeness: number) {
  if (!TIERS.some((t) => t.value === closeness)) throw new Error(`Unknown closeness: ${closeness}`);
  const moved = db.update(people).set({ closeness }).where(eq(people.id, id)).returning().get();
  if (!moved) throw new Error("This person no longer exists.");
  return moved;
}

/** Removes the person. Moments stay; they just no longer list this person. */
export function deletePerson(db: Db, id: number) {
  db.delete(people).where(eq(people.id, id)).run();
}

export function getPerson(db: Db, id: number) {
  return db.select().from(people).where(eq(people.id, id)).get();
}

// Those in the most moments first; on a tie, whoever's latest moment is newest (by day, then time), then A to Z.
const latest = sql`max(${entries.date} || ' ' || coalesce(${entries.time}, ''))`;
const byMoments = [desc(count(entryPeople.entryId)), desc(latest), sql`${people.name} collate nocase`];

/** Everyone, those in the most moments first, then the most recent. */
export function listPeople(db: Db) {
  return db
    .select({ id: people.id, name: people.name, closeness: people.closeness, color: people.color, emoji: people.emoji })
    .from(people)
    .leftJoin(entryPeople, eq(entryPeople.personId, people.id))
    .leftJoin(entries, eq(entries.id, entryPeople.entryId))
    .groupBy(people.id)
    .orderBy(...byMoments)
    .all();
}

/** Everyone in a tier with the date of their latest moment, in the same order as the arcs. */
export function listTier(db: Db, closeness: number) {
  return db
    .select({ id: people.id, name: people.name, color: people.color, emoji: people.emoji, lastMoment: max(entries.date) })
    .from(people)
    .leftJoin(entryPeople, eq(entryPeople.personId, people.id))
    .leftJoin(entries, eq(entries.id, entryPeople.entryId))
    .where(eq(people.closeness, closeness))
    .groupBy(people.id)
    .orderBy(...byMoments)
    .all();
}
