"use server";

import { redirect } from "next/navigation";
import { checkPassword, createAccount, type User } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { signIn, signOut } from "@/lib/session";

// What was typed comes back with an error, so the form keeps it. Never the password.
export type AuthState = { error?: string; name?: string; email?: string };

const field = (form: FormData, name: string) => String(form.get(name) ?? "");
const message = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong. Try again.");

export async function createAccountAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const name = field(form, "name");
  const email = field(form, "email");
  let user: User;
  try {
    user = createAccount(getDb(), { name, email, password: field(form, "password") });
  } catch (e) {
    return { error: message(e), name, email };
  }
  await signIn(user.id);
  redirect("/people");
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  let user: User;
  try {
    user = checkPassword(getDb(), email, field(form, "password"));
  } catch (e) {
    return { error: message(e), email };
  }
  await signIn(user.id);
  redirect("/people");
}

export async function signOutAction() {
  await signOut();
  redirect("/sign-in");
}
