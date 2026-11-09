import { and, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import { people, relationshipTypes } from "@/db/schema";
import type { UserDb } from "@/lib/db";
import { isOneEmoji } from "@/lib/emoji";

/** `people` is who has the type, A to Z, for the warning before deleting it. */
export type RelationshipType = { id: number; name: string; emoji: string; preset: boolean; people: { id: number; name: string }[] };
type TypeInput = { name: string; emoji: string };

/** The presets, and your own types. */
const visible = (userId: number) => or(eq(relationshipTypes.preset, true), eq(relationshipTypes.userId, userId));

/** Presets in the order the migration lists them (the kinds you add most often first), then yours as you added them. */
export function listTypes({ db, userId }: UserDb): RelationshipType[] {
  const who = db
    .select({ typeId: people.typeId, id: people.id, name: people.name })
    .from(people)
    .where(and(eq(people.userId, userId), isNotNull(people.typeId)))
    .orderBy(sql`${people.name} collate nocase`)
    .all();
  return db
    .select({ id: relationshipTypes.id, name: relationshipTypes.name, emoji: relationshipTypes.emoji, preset: relationshipTypes.preset })
    .from(relationshipTypes)
    .where(visible(userId))
    .orderBy(desc(relationshipTypes.preset), relationshipTypes.id)
    .all()
    .map((t) => ({ ...t, people: who.filter((p) => p.typeId === t.id).map(({ id, name }) => ({ id, name })) }));
}

/** Trims and checks a name and emoji; throws a message fit to show the user. `id` is the type being edited. */
function clean(my: UserDb, input: TypeInput, id?: number) {
  const name = input.name.trim();
  const emoji = input.emoji.trim();
  if (!name) throw new Error("A type needs a name.");
  if (!isOneEmoji(emoji)) throw new Error("Pick an emoji for it.");
  if (listTypes(my).some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) throw new Error(`You already have ${name}.`);
  return { name, emoji };
}

/** Presets come with the app, so only your own types can change. */
function yours({ db, userId }: UserDb, id: number) {
  const type = db
    .select()
    .from(relationshipTypes)
    .where(and(eq(relationshipTypes.id, id), visible(userId)))
    .get();
  if (!type) throw new Error("This type no longer exists.");
  if (type.preset) throw new Error(`${type.name} comes with the app, so it can't be changed.`);
}

/** Adds a type of your own. */
export function createType(my: UserDb, input: TypeInput) {
  return my.db
    .insert(relationshipTypes)
    .values({ ...clean(my, input), userId: my.userId })
    .returning()
    .get();
}

/** Renames one of your types or changes its emoji. */
export function updateType(my: UserDb, id: number, input: TypeInput) {
  yours(my, id);
  return my.db.update(relationshipTypes).set(clean(my, input, id)).where(eq(relationshipTypes.id, id)).returning().get();
}

/** Deletes one of your types. Its people are left with no type. */
export function deleteType(my: UserDb, id: number) {
  yours(my, id);
  my.db.delete(relationshipTypes).where(eq(relationshipTypes.id, id)).run();
}
