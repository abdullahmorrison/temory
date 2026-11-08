"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { startDoing } from "@/lib/activities";
import { createMoment, deleteMoment, updateMoment } from "@/lib/moments";

// done is where to go once the form has saved.
export type MomentFormState = { error?: string; done?: string };

function read(form: FormData) {
  return {
    body: String(form.get("body") ?? "").replace(/\r\n?/g, "\n"), // forms send line breaks as \r\n
    date: String(form.get("date") ?? ""),
    time: String(form.get("time") ?? ""),
    personIds: form.getAll("personIds").map(Number),
    viaMention: form.getAll("viaMention").map(Number),
    activityIds: form.getAll("activityIds").map(Number),
    activityViaMention: form.getAll("activityViaMention").map(Number),
  };
}

// Want to activities you said yes to counting as something you do now, as you logged them.
function nowDoing(form: FormData) {
  const ids = form.getAll("nowDoing").map(Number);
  startDoing(getDb(), ids);
  if (ids.length) revalidatePath("/activities", "layout");
}

// back is where the form was opened from, so saving returns there: the journal, or a person's page.
function done(back = "/journal") {
  revalidatePath("/journal");
  if (back !== "/journal") revalidatePath(back);
  return { done: back };
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addMoment(_prev: MomentFormState, form: FormData): Promise<MomentFormState> {
  try {
    createMoment(getDb(), read(form));
    nowDoing(form);
  } catch (e) {
    return { error: message(e) };
  }
  return done();
}

export async function editMoment(id: number, back: string, _prev: MomentFormState, form: FormData): Promise<MomentFormState> {
  try {
    updateMoment(getDb(), id, read(form));
    nowDoing(form);
  } catch (e) {
    return { error: message(e) };
  }
  return done(back);
}

export async function removeMoment(id: number, back: string) {
  deleteMoment(getDb(), id);
  return done(back);
}
