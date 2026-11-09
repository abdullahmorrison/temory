import { createHash, randomBytes } from "node:crypto";
import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import Database from "better-sqlite3";
import { hashPassword } from "../lib/password";
import { SESSION_COOKIE } from "../lib/session-cookie";

export { expect };

/** The test database, also named in playwright.config.ts. */
export const DATABASE_PATH = "e2e/.data/test.db";

/** The account each test starts with. */
export const ME = { name: "Abdullah Morrison", email: "me@example.com", password: "correct horse" };

/**
 * Each test starts with nothing saved but the preset relationship types and one account, so tests don't
 * see each other's things and People never fills up with leftovers. Deletes cascade to the links.
 * The browser starts signed in as that account, unless a test says `test.use({ signedIn: false })`.
 */
export const test = base.extend<{ signedIn: boolean; fresh: void }>({
  signedIn: [true, { option: true }],
  fresh: [
    async ({ context, baseURL, signedIn }, use) => {
      const db = new Database(DATABASE_PATH);
      db.pragma("foreign_keys = ON");
      db.exec("DELETE FROM entries; DELETE FROM places; DELETE FROM activities; DELETE FROM people; DELETE FROM relationship_types WHERE preset = 0; DELETE FROM users;");
      const { id } = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?) RETURNING id").get(ME.name, ME.email, hashPassword(ME.password)) as { id: number };
      if (signedIn) {
        const token = randomBytes(32).toString("base64url");
        const expires = new Date(Date.now() + 86_400_000);
        db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(createHash("sha256").update(token).digest("hex"), id, expires.toISOString());
        await context.addCookies([{ name: SESSION_COOKIE, value: token, url: baseURL!, httpOnly: true, sameSite: "Lax", expires: expires.getTime() / 1000 }]);
      }
      db.close();
      await use();
    },
    { auto: true },
  ],
});

export const isPhone = (info: TestInfo) => info.project.name === "phone";

// Next keeps pages you've left in the document, hidden, so each lookup takes only what's on screen.

/** A text field by its placeholder. */
export const field = (page: Page, placeholder: string) => page.getByPlaceholder(placeholder).filter({ visible: true });

/** The moment editor. */
export const editor = (page: Page) => page.getByRole("textbox", { name: "What happened?" }).filter({ visible: true });

/** A link on screen by its name. A string must match the whole name; a regex can match part of it. */
export const link = (page: Page, name: string | RegExp) => page.getByRole("link", { name, exact: typeof name === "string" }).filter({ visible: true });

/** Follows a link by its name and waits until it lands on `href`. */
export async function follow(page: Page, name: string | RegExp, href: string | RegExp) {
  await link(page, name).click();
  await expect(page).toHaveURL(href);
}

/** Opens a link that contains `text`, like a person's bubble or a moment in a list. */
export async function open(page: Page, text: string) {
  await link(page, new RegExp(text)).click(); // test names are plain words, safe as a pattern
}

/** Adds a person from People and waits until the form has closed. */
export async function addPerson(page: Page, name: string) {
  await page.goto("/people");
  await follow(page, "Add person", "/people/new");
  await field(page, "Name").fill(name);
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(page).toHaveURL("/people");
}

/** Writes a moment from the Log button and waits until the form has closed. */
export async function logMoment(page: Page, text: string) {
  await follow(page, "Log a moment", "/write");
  await editor(page).click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).not.toHaveURL("/write");
}

/** Adds an activity from Activities and waits until its page opens. Returns that page's path. */
export async function addActivity(page: Page, name: string, status: "Doing" | "Want to" | "Past" = "Doing") {
  await page.goto("/activities");
  await follow(page, "Add activity", "/activities/new");
  await field(page, "Name").fill(name);
  if (status !== "Doing") await page.getByRole("radio", { name: status }).click();
  await page.getByRole("button", { name: "Add activity" }).click();
  await expect(page).toHaveURL(/\/activities\/\d+$/);
  return new URL(page.url()).pathname;
}

/** Opens a person's profile from People and returns its path. */
export async function openProfile(page: Page, name: string) {
  await page.goto("/people");
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  return new URL(page.url()).pathname;
}

/** Deletes from an edit page: the first tap asks, the second deletes. */
export async function confirmDelete(page: Page, label: string) {
  await page.getByRole("button", { name: label }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
}

/** Types into the moment editor, picking a suggestion after `@` or `/`. */
export async function mention(page: Page, char: "@" | "/", name: string) {
  await page.keyboard.type(`${char}${name}`);
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Enter");
}
