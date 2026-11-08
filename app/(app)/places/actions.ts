"use server";

import { revalidatePath } from "next/cache";
import { signedIn } from "@/lib/session";
import { createPlace, deletePlace, updatePlace } from "@/lib/places";

// done is where to go once the form has saved.
export type PlaceFormState = { error?: string; done?: string };

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
function done(path: string) {
  revalidatePath("/places", "layout");
  return { done: path };
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addPlace(_prev: PlaceFormState, form: FormData): Promise<PlaceFormState> {
  const my = await signedIn();
  try {
    createPlace(my, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  // Back to the whole city, so the pin is seen among the others. Editing does the same.
  return done("/places");
}

export async function editPlace(id: number, _prev: PlaceFormState, form: FormData): Promise<PlaceFormState> {
  const my = await signedIn();
  try {
    updatePlace(my, id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  return done("/places");
}

export async function removePlace(id: number) {
  const my = await signedIn();
  deletePlace(my, id);
  return done("/places");
}
