import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getActivity } from "@/lib/activities";
import { getDb } from "@/lib/db";

/** The activity for an /activities/[id] route, or the not-found page. */
export async function activityFromParams(params: Promise<{ id: string }>) {
  await connection(); // read the database per request, not at build time
  const id = Number((await params).id);
  const activity = Number.isInteger(id) ? getActivity(getDb(), id) : undefined;
  if (!activity) notFound();
  return activity;
}

/** "4 people · 9 moments" */
export function countLabel(people: number, moments: number) {
  return `${people} ${people === 1 ? "person" : "people"} · ${moments} ${moments === 1 ? "moment" : "moments"}`;
}
