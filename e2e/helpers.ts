import { expect, type Page, type TestInfo } from "@playwright/test";

/** Every test shares one database, so names carry a suffix to stay apart. One word, since bubbles show first names. */
export const unique = (name: string) => `${name}-${Math.random().toString(36).slice(2, 7)}`;

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
