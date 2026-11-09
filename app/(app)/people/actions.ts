"use server";

import { revalidatePath } from "next/cache";
import { signedIn } from "@/lib/session";
import { bringBack, createPerson, deletePerson, endRelationship, moveToTier, updatePerson } from "@/lib/people";
import { createType, deleteType, updateType } from "@/lib/relationship-types";

// done is where to go once the form has saved.
export type PersonFormState = { error?: string; done?: string };

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
function done(path: string) {
  revalidatePath("/people", "layout");
  return { done: path };
}

function message(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Try again.";
}

export async function addPerson(_prev: PersonFormState, form: FormData): Promise<PersonFormState> {
  const my = await signedIn();
  try {
    createPerson(my, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  return done("/people");
}

export async function editPerson(id: number, _prev: PersonFormState, form: FormData): Promise<PersonFormState> {
  const my = await signedIn();
  try {
    updatePerson(my, id, read(form));
  } catch (e) {
    return { error: message(e) };
  }
  return done(`/people/${id}`);
}

export async function removePerson(id: number) {
  const my = await signedIn();
  deletePerson(my, id);
  return done("/people");
}

export type TypeResult = { id?: number; error?: string };

// Each change refreshes the /people layout, so every open form and badge shows it right away.
function typeChange(change: () => number | void): TypeResult {
  try {
    const id = change() ?? undefined;
    revalidatePath("/people", "layout");
    return { id };
  } catch (e) {
    return { error: message(e) };
  }
}

/** Makes a relationship type of your own from the person form, which then picks it. */
export async function addRelationshipType(name: string, emoji: string) {
  const my = await signedIn();
  return typeChange(() => createType(my, { name, emoji }).id);
}

export async function editRelationshipType(id: number, name: string, emoji: string) {
  const my = await signedIn();
  return typeChange(() => updateType(my, id, { name, emoji }).id);
}

export async function removeRelationshipType(id: number) {
  const my = await signedIn();
  return typeChange(() => deleteType(my, id));
}

/** Drag-and-drop between tiers. Returns an error instead of redirecting, so the arcs can snap back. */
export async function movePerson(id: number, closeness: number): Promise<PersonFormState> {
  const my = await signedIn();
  try {
    moveToTier(my, id, closeness);
  } catch (e) {
    return { error: message(e) };
  }
  revalidatePath("/people", "layout");
  return {};
}

/** Ends the relationship on the day it is on your clock (`today`), from the person's Edit page. */
export async function endRelationshipWith(id: number, today: string): Promise<PersonFormState> {
  const my = await signedIn();
  try {
    endRelationship(my, id, today);
  } catch (e) {
    return { error: message(e) };
  }
  return done(`/people/${id}`);
}

/** Brings someone from the past back into a tier. */
export async function bringPersonBack(id: number, closeness: number): Promise<PersonFormState> {
  const my = await signedIn();
  try {
    bringBack(my, id, closeness);
  } catch (e) {
    return { error: message(e) };
  }
  return done(`/people/${id}`);
}
