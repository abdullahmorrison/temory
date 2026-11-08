"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createPlace, deletePlace, updatePlace } from "@/lib/places";

export type PlaceFormState = { error?: string };

function read(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    address: String(form.get("address") ?? ""),
    area: String(form.get("area") ?? ""),
    lat: Number(form.get("lat")),
    lng: Number(form.get("lng")),
    alias: String(form.get("alias") ?? ""),
    personIds: form.getAll("personIds").map(Number),
  };
}

// The map lives in the /places layout on desktop, which Next.js reuses across navigations; refresh it
// after any change so its pins stay current.
function done(path: string): never {
  revalidatePath("/places", "layout");
  redirect(path);
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addPlace(_prev: PlaceFormState, form: FormData): Promise<PlaceFormState> {
  let id: number;
  try {
    id = createPlace(getDb(), read(form)).id;
  } catch (e) {
    return { error: message(e) };
  }
  done(`/places?place=${id}`);
}

export async function editPlace(id: number, _prev: PlaceFormState, form: FormData): Promise<PlaceFormState> {
  try {
    updatePlace(getDb(), id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  done(`/places?place=${id}`);
}

export async function removePlace(id: number) {
  deletePlace(getDb(), id);
  done("/places");
}
