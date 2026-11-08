import { expect, test } from "@playwright/test";
import { addPerson, editor, field, follow, logMoment, open, unique } from "./helpers";

// Next keeps a page you've left alive with its state, so forms must show what's saved, not what they held.

test("a moment's edit survives reopening and saving it again", async ({ page }) => {
  const first = unique("Rough day");
  const edited = unique("Good day");
  await page.goto("/journal");
  await logMoment(page, first);

  await open(page, first);
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type(edited);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await open(page, edited);
  await expect(editor(page)).toHaveText(edited);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await page.reload();
  await expect(page.getByText(edited).filter({ visible: true })).toBeVisible();
  await expect(page.getByText(first)).toHaveCount(0);
});

test("a person's edit form shows what was last saved", async ({ page }) => {
  const name = unique("Sam");
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  const profile = new URL(page.url()).pathname;

  for (const next of [unique("Sammy"), unique("Samuel")]) {
    await follow(page, `${profile}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(profile);
  }
  await follow(page, `${profile}/edit`);
  await expect(field(page, "Name")).toHaveValue(/^Samuel-/);
});

test("an activity's edit form shows what was last saved", async ({ page }) => {
  await page.goto("/activities");
  await follow(page, "/activities/new");
  await field(page, "Name").fill(unique("Chess"));
  await page.getByRole("button", { name: "Add activity" }).click();
  await expect(page).toHaveURL(/\/activities\/\d+$/);
  const activity = new URL(page.url()).pathname;

  for (const next of [unique("Blitz"), unique("Bughouse")]) {
    await follow(page, `${activity}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(activity);
    await expect(page.getByRole("heading", { name: next })).toBeVisible();
  }
  await follow(page, `${activity}/edit`);
  await expect(field(page, "Name")).toHaveValue(/^Bughouse-/);
});

test("a form opened again after saving starts empty and stays open", async ({ page }) => {
  await page.goto("/journal");
  await logMoment(page, unique("Coffee"));
  await follow(page, "/write");
  await expect(editor(page)).toHaveText("");
  await page.waitForTimeout(1000); // the bug closed it a moment after opening
  await expect(page).toHaveURL("/write");

  await page.goto("/activities");
  await follow(page, "/activities/new");
  await field(page, "Name").fill(unique("Pottery"));
  await page.getByRole("button", { name: "Add activity" }).click();
  await expect(page).toHaveURL(/\/activities\/\d+$/);
  await follow(page, "/activities");
  await follow(page, "/activities/new");
  await expect(field(page, "Name")).toHaveValue("");
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL("/activities/new");
});
