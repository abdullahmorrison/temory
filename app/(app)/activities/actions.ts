"use server";

import { revalidatePath } from "next/cache";
import { createActivity, deleteActivity, setActivityStatus, updateActivity } from "@/lib/activities";
import { getDb } from "@/lib/db";

// done is where to go once the form has saved.
export type ActivityFormState = { error?: string; done?: string };

function read(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    icon: String(form.get("icon") ?? ""),
    status: String(form.get("status") ?? "doing"),
    notes: String(form.get("notes") ?? ""),
    personIds: form.getAll("personIds").map(Number),
  };
}

// The list lives in the /activities layout on desktop, which Next.js reuses across navigations;
// refresh it after any change so names, icons, and people stay current.
function done(path: string) {
  revalidatePath("/activities", "layout");
  return { done: path };
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addActivity(_prev: ActivityFormState, form: FormData): Promise<ActivityFormState> {
  let id: number;
  try {
    id = createActivity(getDb(), read(form)).id;
  } catch (e) {
    return { error: message(e) };
  }
  return done(`/activities/${id}`);
}

export async function editActivity(id: number, _prev: ActivityFormState, form: FormData): Promise<ActivityFormState> {
  try {
    updateActivity(getDb(), id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  return done(`/activities/${id}`);
}

/** The Doing · Want to · Past switch on an activity's page. */
export async function changeActivityStatus(id: number, status: string): Promise<ActivityFormState> {
  try {
    setActivityStatus(getDb(), id, status);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/activities", "layout");
  return {};
}

export async function removeActivity(id: number) {
  deleteActivity(getDb(), id);
  return done("/activities");
}
