import { notFound } from "next/navigation";
import { connection } from "next/server";
import { signedIn } from "@/lib/session";
import { getPerson } from "@/lib/people";

/** The person for a /people/[id] route, or the not-found page. */
export async function personFromParams(params: Promise<{ id: string }>) {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  const id = Number((await params).id);
  const person = Number.isInteger(id) ? getPerson(my, id) : undefined;
  if (!person) notFound();
  return person;
}
