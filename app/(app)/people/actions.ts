"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createPerson, deletePerson, moveToTier, updatePerson } from "@/lib/people";
import { createType, type RelationshipType } from "@/lib/relationship-types";

export type PersonFormState = { error?: string };

function read(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    closeness: Number(form.get("closeness")),
    typeId: Number(form.get("typeId")) || null,
    notes: String(form.get("notes") ?? ""),
  };
}

// The arcs live in the /people layout, which Next.js reuses across navigations; refresh it after
// any change to people so the arcs and counts stay current.
function done(path: string): never {
  revalidatePath("/people", "layout");
  redirect(path);
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addPerson(_prev: PersonFormState, form: FormData): Promise<PersonFormState> {
  try {
    createPerson(getDb(), read(form));
  } catch (e) {
    return { error: message(e) };
  }
  done("/people");
}

export async function editPerson(id: number, _prev: PersonFormState, form: FormData): Promise<PersonFormState> {
  try {
    updatePerson(getDb(), id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  done(`/people/${id}`);
}

export async function removePerson(id: number) {
  deletePerson(getDb(), id);
  done("/people");
}

/** Makes a relationship type of your own from the person form, which then picks it. */
export async function addRelationshipType(name: string, emoji: string): Promise<{ type?: RelationshipType; error?: string }> {
  try {
    return { type: createType(getDb(), { name, emoji }) };
  } catch (e) {
    return { error: message(e) };
  }
}

/** Drag-and-drop between tiers. Returns an error instead of redirecting, so the arcs can snap back. */
export async function movePerson(id: number, closeness: number): Promise<PersonFormState> {
  try {
    moveToTier(getDb(), id, closeness);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/people", "layout");
  return {};
}
