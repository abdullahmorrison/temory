"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createActivity, deleteActivity, setActivityStatus, updateActivity } from "@/lib/activities";
import { getDb } from "@/lib/db";

export type ActivityFormState = { error?: string };

function read(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    icon: String(form.get("icon") ?? ""),
    status: String(form.get("status") ?? "doing"),
    inTheWay: String(form.get("inTheWay") ?? ""),
    notes: String(form.get("notes") ?? ""),
    personIds: form.getAll("personIds").map(Number),
  };
}

// The list lives in the /activities layout on desktop, which Next.js reuses across navigations;
// refresh it after any change so names, icons, and people stay current.
function done(path: string): never {
  revalidatePath("/activities", "layout");
  redirect(path);
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
  done(`/activities/${id}`);
}

export async function editActivity(id: number, _prev: ActivityFormState, form: FormData): Promise<ActivityFormState> {
  try {
    updateActivity(getDb(), id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  done(`/activities/${id}`);
}

/** The Doing · Want to · Past switch on an activity's page. */
export async function changeActivityStatus(id: number, status: string) {
  setActivityStatus(getDb(), id, status);
  revalidatePath("/activities", "layout");
}

export async function removeActivity(id: number) {
  deleteActivity(getDb(), id);
  done("/activities");
}
