import { test as base, expect, type Page, type TestInfo } from "@playwright/test";
import Database from "better-sqlite3";

export { expect };

/** The test database, also named in playwright.config.ts. */
export const DATABASE_PATH = "e2e/.data/test.db";

/**
 * Each test starts with nothing saved but the preset relationship types, so tests don't see each
 * other's people, and People never fills up with leftovers. Deletes cascade to the links.
 */
export const test = base.extend<{ fresh: void }>({
  fresh: [
    async ({}, use) => {
      const db = new Database(DATABASE_PATH);
      db.pragma("foreign_keys = ON");
      db.exec("DELETE FROM entries; DELETE FROM places; DELETE FROM activities; DELETE FROM people; DELETE FROM relationship_types WHERE preset = 0;");
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
export const editor = (page: Page) => page.locator(".ProseMirror").filter({ visible: true });

/** Clicks the visible link to `href`: phones and desktop each hide the other's copy of the nav. */
export async function follow(page: Page, href: string) {
  await page.locator(`a[href="${href}"]:visible`).first().click();
  await expect(page).toHaveURL(href);
}

/** Opens a link by its text, like a person's bubble or a moment in the journal. */
export async function open(page: Page, text: string) {
  await page.locator("a", { hasText: text }).filter({ visible: true }).first().click();
}

/** Adds a person from People and waits until the form has closed. */
export async function addPerson(page: Page, name: string) {
  await page.goto("/people");
  await follow(page, "/people/new");
  await field(page, "Name").fill(name);
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(page).toHaveURL("/people");
}

/** Writes a moment from the Log button and waits until the form has closed. */
export async function logMoment(page: Page, text: string) {
  await follow(page, "/write");
  await editor(page).click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).not.toHaveURL("/write");
}

/** Adds an activity from Activities and waits until its page opens. Returns that page's path. */
export async function addActivity(page: Page, name: string, status: "Doing" | "Want to" | "Past" = "Doing") {
  await page.goto("/activities");
  await follow(page, "/activities/new");
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
