import { connection } from "next/server";
import { PeopleTiers } from "@/components/people-tiers";
import { signedIn } from "@/lib/session";
import { listPeople } from "@/lib/people";

/** The arcs, filled from the database. Past relationships stay off them and are only counted. */
export async function Tiers() {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  const everyone = listPeople(my);
  return <PeopleTiers people={everyone.filter((p) => !p.endedAt)} past={everyone.filter((p) => p.endedAt).length} />;
}
