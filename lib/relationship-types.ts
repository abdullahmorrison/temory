import { desc } from "drizzle-orm";
import { relationshipTypes } from "@/db/schema";
import type { Db } from "@/lib/db";
import { isOneEmoji } from "@/lib/emoji";

export type RelationshipType = { id: number; name: string; emoji: string; preset: boolean };

const columns = { id: relationshipTypes.id, name: relationshipTypes.name, emoji: relationshipTypes.emoji, preset: relationshipTypes.preset };

/** Presets in the order the migration lists them (the kinds you add most often first), then yours as you added them. */
export function listTypes(db: Db): RelationshipType[] {
  return db.select(columns).from(relationshipTypes).orderBy(desc(relationshipTypes.preset), relationshipTypes.id).all();
}

/** Adds a type of your own; throws a message fit to show the user. */
export function createType(db: Db, input: { name: string; emoji: string }): RelationshipType {
  const name = input.name.trim();
  const emoji = input.emoji.trim();
  if (!name) throw new Error("A type needs a name.");
  if (!isOneEmoji(emoji)) throw new Error("Pick an emoji for it.");
  if (listTypes(db).some((t) => t.name.toLowerCase() === name.toLowerCase())) throw new Error(`You already have ${name}.`);
  return db.insert(relationshipTypes).values({ name, emoji }).returning(columns).get();
}
