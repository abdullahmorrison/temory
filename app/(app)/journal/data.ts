import { connection } from "next/server";
import { listActivities } from "@/lib/activities";
import { getDb } from "@/lib/db";
import { listPeople } from "@/lib/people";

/** Everyone, for the "with" picker. Read per request, not at build time. */
export async function peopleForPicker() {
  await connection();
  return listPeople(getDb()).sort((a, b) => a.closeness - b.closeness || a.name.localeCompare(b.name));
}

/** Every activity, for the "doing" picker and the / menu: Doing, then Want to, then Past. */
export async function activitiesForPicker() {
  await connection();
  return listActivities(getDb()).map(({ id, name, icon, status }) => ({ id, name, icon, status }));
}
