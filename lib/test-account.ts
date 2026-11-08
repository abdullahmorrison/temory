import { users } from "@/db/schema";
import { openDb, type Db, type UserDb } from "@/lib/db";

/** For tests: a throwaway database with one account in it, as that account sees it. */
export function account(): UserDb {
  const db = openDb(":memory:");
  return { db, userId: addUser(db, "me@example.com") };
}

/** For tests: someone else's account in the same database. */
export function otherAccount({ db }: UserDb): UserDb {
  return { db, userId: addUser(db, `someone-${Math.random()}@example.com`) };
}

function addUser(db: Db, email: string) {
  return db.insert(users).values({ name: "Test", email, passwordHash: "-" }).returning().get().id;
}
