import { connection } from "next/server";
import { PeopleTiers } from "@/components/people-tiers";
import { signedIn } from "@/lib/session";
import { listPeople } from "@/lib/people";

/** The arcs, filled from the database. */
export async function Tiers() {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  return <PeopleTiers people={listPeople(my)} />;
}
