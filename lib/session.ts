// The signed-in account, read from the session cookie on the server. Every page and action that reads or
// writes someone's things goes through signedIn(); proxy.ts only does a quick check that a cookie exists.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { endSession, sessionUser, startSession, type User } from "@/lib/auth";
import { getDb, type UserDb } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session-cookie";

/** Who's signed in, if anyone. */
export async function currentUser(): Promise<User | undefined> {
  await connection(); // per request, never while prerendering: a session depends on the cookie and the clock
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sessionUser(getDb(), token) : undefined;
}

/** The database as the signed-in account sees it, or off to Sign in. Call it outside try/catch: the redirect throws. */
export async function signedIn(): Promise<UserDb> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return { db: getDb(), userId: user.id };
}

/** Signs this browser in as `userId`. Server actions only, since it sets a cookie. */
export async function signIn(userId: number) {
  const { token, expiresAt } = startSession(getDb(), userId);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Signs this browser out. Server actions only. */
export async function signOut() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) endSession(getDb(), token);
  jar.delete(SESSION_COOKIE);
}
