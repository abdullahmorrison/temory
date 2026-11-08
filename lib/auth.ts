import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { activities, entries, people, places, relationshipTypes, sessions, users } from "@/db/schema";
import type { Db } from "@/lib/db";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "@/lib/password";

export type User = { id: number; name: string; email: string };
type AccountInput = { name: string; email: string; password: string };

const SESSION_DAYS = 90;
const NO_MATCH = "That email and password don't match.";
// Compared against when there's no such account, so a wrong email takes as long as a wrong password.
const DECOY = hashPassword("not anyone's password");

export const normalEmail = (email: string) => email.trim().toLowerCase();
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Makes an account. The first one also takes everything saved before there were accounts. */
export function createAccount(db: Db, input: AccountInput): User {
  const name = input.name.trim();
  const email = normalEmail(input.email);
  if (!name) throw new Error("Add your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("That doesn't look like an email.");
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new Error(`Use at least ${MIN_PASSWORD_LENGTH} characters for your password.`);
  if (db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) throw new Error("There's already an account with that email. Sign in instead.");
  return db.transaction((tx) => {
    const first = !tx.select({ id: users.id }).from(users).get();
    const user = tx.insert(users).values({ name, email, passwordHash: hashPassword(input.password) }).returning({ id: users.id, name: users.name, email: users.email }).get();
    if (first) {
      for (const table of [people, entries, places, activities]) tx.update(table).set({ userId: user.id }).where(isNull(table.userId)).run();
      tx.update(relationshipTypes).set({ userId: user.id }).where(and(isNull(relationshipTypes.userId), eq(relationshipTypes.preset, false))).run();
    }
    return user;
  });
}

/** The account for an email and password; throws the same message whether the email or the password is wrong. */
export function checkPassword(db: Db, email: string, password: string): User {
  const user = db.select().from(users).where(eq(users.email, normalEmail(email))).get();
  const matches = verifyPassword(password, user?.passwordHash ?? DECOY);
  if (!user || !matches) throw new Error(NO_MATCH);
  return { id: user.id, name: user.name, email: user.email };
}

/** Signs a browser in: returns the token for its cookie, and when it runs out. */
export function startSession(db: Db, userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  db.insert(sessions).values({ tokenHash: tokenHash(token), userId, expiresAt: expiresAt.toISOString() }).run();
  return { token, expiresAt };
}

/** Who a cookie's token belongs to, if it's still good. */
export function sessionUser(db: Db, token: string): User | undefined {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash(token)), gt(sessions.expiresAt, new Date().toISOString())))
    .get();
}

/** Signs a browser out. */
export function endSession(db: Db, token: string) {
  db.delete(sessions).where(eq(sessions.tokenHash, tokenHash(token))).run();
}
