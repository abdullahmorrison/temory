import { connection } from "next/server";
import { listActivities } from "@/lib/activities";
import { signedIn } from "@/lib/session";
import { listPeople } from "@/lib/people";

/** Everyone, for the "with" picker. Read per request, not at build time. */
export async function peopleForPicker() {
  await connection();
  const my = await signedIn();
  return listPeople(my).sort((a, b) => a.closeness - b.closeness || a.name.localeCompare(b.name));
}

/** Every activity, for the "doing" picker and the / menu: Doing, then Want to, then Past. */
export async function activitiesForPicker() {
  await connection();
  const my = await signedIn();
  return listActivities(my).map(({ id, name, icon, status }) => ({ id, name, icon, status }));
}
