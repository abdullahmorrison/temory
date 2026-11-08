import { sql } from "drizzle-orm";
import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// user_id stays empty until there are accounts; it saves a data migration when the app goes public.
const createdAt = () => text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);

// What someone is to you, like "Work friend". Presets come with the app; the rest are yours.
export const relationshipTypes = sqliteTable("relationship_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(), // shown as a badge on the avatars of people of this type
  preset: integer("preset", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const people = sqliteTable("people", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  closeness: integer("closeness").notNull(), // 1 = closest; see lib/tiers.ts
  color: integer("color").notNull(), // index into lib/person-colors.ts
  typeId: integer("type_id").references(() => relationshipTypes.id, { onDelete: "set null" }),
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  body: text("body").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time"), // HH:MM on the writer's clock; empty when unknown, as for moments logged on a later day
  createdAt: createdAt(),
});

// Who a moment is with. No rows means a solo moment.
export const entryPeople = sqliteTable(
  "entry_people",
  {
    entryId: integer("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    // There only because the text mentions them: deleting the mention takes them out.
    viaMention: integer("via_mention", { mode: "boolean" }).notNull().default(false),
  },
  // The primary key covers lookups by entry; the index covers a person's timeline.
  (t) => [primaryKey({ columns: [t.entryId, t.personId] }), index("entry_people_person_id").on(t.personId)],
);

export const places = sqliteTable("places", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(), // the place's own name from the address search, like "Cal Anderson Park"
  alias: text("alias").notNull().default(""), // what you call it, like "Sam's place"; shown instead of the name
  address: text("address").notNull().default(""),
  area: text("area").notNull().default(""), // neighbourhood or city, for a short line under the name
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  createdAt: createdAt(),
});

export const personPlaces = sqliteTable(
  "person_places",
  {
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
    placeId: integer("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
  },
  // The primary key covers lookups by person; the index covers who goes to a place.
  (t) => [primaryKey({ columns: [t.personId, t.placeId] }), index("person_places_place_id").on(t.placeId)],
);

export const activities = sqliteTable("activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  name: text("name").notNull(),
  icon: text("icon").notNull(), // a key of ACTIVITY_ICONS in lib/activity-icons.ts
  notes: text("notes").notNull().default(""),
  createdAt: createdAt(),
});

// Who you do an activity with.
export const activityPeople = sqliteTable(
  "activity_people",
  {
    activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
    personId: integer("person_id").notNull().references(() => people.id, { onDelete: "cascade" }),
  },
  // The primary key covers lookups by activity; the index covers a person's activities.
  (t) => [primaryKey({ columns: [t.activityId, t.personId] }), index("activity_people_person_id").on(t.personId)],
);

// What a moment was spent doing.
export const entryActivities = sqliteTable(
  "entry_activities",
  {
    entryId: integer("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    activityId: integer("activity_id").notNull().references(() => activities.id, { onDelete: "cascade" }),
    // There only because the text names it with /: deleting that takes it out.
    viaMention: integer("via_mention", { mode: "boolean" }).notNull().default(false),
  },
  // The primary key covers lookups by entry; the index covers an activity's moments.
  (t) => [primaryKey({ columns: [t.entryId, t.activityId] }), index("entry_activities_activity_id").on(t.activityId)],
);
