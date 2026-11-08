import { desc, eq, isNotNull, sql } from "drizzle-orm";
import { people, relationshipTypes } from "@/db/schema";
import type { Db } from "@/lib/db";
import { isOneEmoji } from "@/lib/emoji";

/** `people` is who has the type, A to Z, for the warning before deleting it. */
export type RelationshipType = { id: number; name: string; emoji: string; preset: boolean; people: { id: number; name: string }[] };
type TypeInput = { name: string; emoji: string };

/** Presets in the order the migration lists them (the kinds you add most often first), then yours as you added them. */
export function listTypes(db: Db): RelationshipType[] {
  const who = db
    .select({ typeId: people.typeId, id: people.id, name: people.name })
    .from(people)
    .where(isNotNull(people.typeId))
    .orderBy(sql`${people.name} collate nocase`)
    .all();
  return db
    .select({ id: relationshipTypes.id, name: relationshipTypes.name, emoji: relationshipTypes.emoji, preset: relationshipTypes.preset })
    .from(relationshipTypes)
    .orderBy(desc(relationshipTypes.preset), relationshipTypes.id)
    .all()
    .map((t) => ({ ...t, people: who.filter((p) => p.typeId === t.id).map(({ id, name }) => ({ id, name })) }));
}

/** Trims and checks a name and emoji; throws a message fit to show the user. `id` is the type being edited. */
function clean(db: Db, input: TypeInput, id?: number) {
  const name = input.name.trim();
  const emoji = input.emoji.trim();
  if (!name) throw new Error("A type needs a name.");
  if (!isOneEmoji(emoji)) throw new Error("Pick an emoji for it.");
  if (listTypes(db).some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) throw new Error(`You already have ${name}.`);
  return { name, emoji };
}

/** Presets come with the app, so only your own types can change. */
function yours(db: Db, id: number) {
  const type = db.select().from(relationshipTypes).where(eq(relationshipTypes.id, id)).get();
  if (!type) throw new Error("This type no longer exists.");
  if (type.preset) throw new Error(`${type.name} comes with the app, so it can't be changed.`);
}

/** Adds a type of your own. */
export function createType(db: Db, input: TypeInput) {
  return db.insert(relationshipTypes).values(clean(db, input)).returning().get();
}

/** Renames one of your types or changes its emoji. */
export function updateType(db: Db, id: number, input: TypeInput) {
  yours(db, id);
  return db.update(relationshipTypes).set(clean(db, input, id)).where(eq(relationshipTypes.id, id)).returning().get();
}

/** Deletes one of your types. Its people are left with no type. */
export function deleteType(db: Db, id: number) {
  yours(db, id);
  db.delete(relationshipTypes).where(eq(relationshipTypes.id, id)).run();
}
