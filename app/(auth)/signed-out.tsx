import { redirect } from "next/navigation";
import { connection } from "next/server";
import { currentUser } from "@/lib/session";

/** Shows its form only when no one is signed in; someone who is goes straight to the app. */
export async function SignedOut({ children }: { children: React.ReactNode }) {
  await connection(); // reads the cookie per request
  if (await currentUser()) redirect("/people");
  return children;
}
