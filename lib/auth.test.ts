import { describe, expect, it } from "vitest";
import { activities, entries, people, places, relationshipTypes, sessions } from "@/db/schema";
import { checkPassword, createAccount, endSession, sessionUser, startSession } from "./auth";
import { openDb } from "./db";
import { hashPassword, verifyPassword } from "./password";

const me = { name: " Abdullah ", email: " Me@Example.com ", password: "correct horse" };

describe("passwords", () => {
  it("are salted, and only the right one matches", () => {
    const stored = hashPassword("correct horse");
    expect(stored).not.toContain("correct horse");
    expect(hashPassword("correct horse")).not.toBe(stored);
    expect(verifyPassword("correct horse", stored)).toBe(true);
    expect(verifyPassword("wrong horse", stored)).toBe(false);
    expect(verifyPassword("correct horse", "garbage")).toBe(false);
  });
});

describe("createAccount", () => {
  it("trims the name, keeps the email lowercase, and needs a real email and a long enough password", () => {
    const db = openDb(":memory:");
    expect(createAccount(db, me)).toMatchObject({ name: "Abdullah", email: "me@example.com" });
    expect(() => createAccount(db, { ...me, name: " " })).toThrow("Add your name");
    expect(() => createAccount(db, { ...me, email: "nope" })).toThrow("doesn't look like an email");
    expect(() => createAccount(db, { ...me, email: "new@example.com", password: "short" })).toThrow("at least 8");
    expect(() => createAccount(db, { ...me, email: "ME@example.com" })).toThrow("already an account");
  });

  it("gives everything saved before accounts to the first one only", () => {
    const db = openDb(":memory:");
    db.insert(people).values({ name: "Sam", closeness: 2, color: 0 }).run();
    db.insert(entries).values({ body: "Ramen", date: "2026-10-20" }).run();
    db.insert(places).values({ name: "Park", lat: 1, lng: 1 }).run();
    db.insert(activities).values({ name: "Chess", icon: "dices" }).run();
    db.insert(relationshipTypes).values({ name: "Climbing", emoji: "🧗" }).run();
    const first = createAccount(db, me);
    createAccount(db, { ...me, email: "second@example.com" });
    for (const table of [people, entries, places, activities]) expect(db.select({ userId: table.userId }).from(table).all()).toEqual([{ userId: first.id }]);
    expect(db.select({ userId: relationshipTypes.userId }).from(relationshipTypes).all().filter((t) => t.userId !== null)).toEqual([{ userId: first.id }]);
  });
});

describe("checkPassword", () => {
  it("finds the account by email in any case, and says the same thing for a wrong email or password", () => {
    const db = openDb(":memory:");
    const user = createAccount(db, me);
    expect(checkPassword(db, "ME@example.com ", "correct horse")).toEqual(user);
    expect(() => checkPassword(db, "me@example.com", "wrong")).toThrow("That email and password don't match.");
    expect(() => checkPassword(db, "nobody@example.com", "correct horse")).toThrow("That email and password don't match.");
  });
});

describe("sessions", () => {
  it("sign a browser in until they end or run out, and keep only the token's hash", () => {
    const db = openDb(":memory:");
    const user = createAccount(db, me);
    const { token } = startSession(db, user.id);
    expect(sessionUser(db, token)).toEqual(user);
    expect(JSON.stringify(db.select().from(sessions).all())).not.toContain(token);
    expect(sessionUser(db, "made-up")).toBeUndefined();

    endSession(db, token);
    expect(sessionUser(db, token)).toBeUndefined();

    const old = startSession(db, user.id);
    db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000).toISOString() }).run();
    expect(sessionUser(db, old.token)).toBeUndefined();
  });
});
