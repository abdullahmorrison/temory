import { expect, test } from "@playwright/test";
import { addPerson, field, follow, isPhone, open, unique } from "./helpers";

// Back only undoes pages that sit on top of another (#56). Everything else replaces the current entry.

test("switching tabs doesn't add to history, so Back leaves the app", async ({ page }) => {
  await page.goto("/people");
  for (const tab of ["/journal", "/activities", "/places", "/people"]) await follow(page, tab);
  await page.goBack();
  await expect(page).toHaveURL("about:blank");
});

test("a profile sits on top of People on phones, and beside it on desktop", async ({ page }, info) => {
  const name = unique("Priya");
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  await page.goBack();
  // On desktop the profile opened in place of what was beside the list, so Back leaves the app.
  await expect(page).toHaveURL(isPhone(info) ? "/people" : "about:blank");
});

test("Back after saving a form doesn't reopen it", async ({ page }, info) => {
  const name = unique("Jordan");
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  const profile = new URL(page.url()).pathname;

  await follow(page, `${profile}/edit`);
  await field(page, "Name").fill(unique("Jordy"));
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(profile);

  await page.goBack();
  await expect(page).not.toHaveURL(/\/edit$/);
  if (isPhone(info)) await expect(page).toHaveURL("/people");
});
