import { addPerson, confirmDelete, expect, field, follow, isPhone, open, openProfile, test } from "./helpers";

// Back only undoes pages that sit on top of another (#56). Everything else replaces the current entry.

test("switching tabs doesn't add to history, so Back leaves the app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/people");
  for (const tab of ["/journal", "/activities", "/places", "/people"]) await follow(page, tab);
  await page.goBack();
  await expect(page).toHaveURL("about:blank");
});

test("a profile sits on top of People on phones, and beside it on desktop", async ({ page }, info) => {
  const name = "Priya";
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  await page.goBack();
  // On desktop the profile opened in place of what was beside the list, so Back leaves the app.
  await expect(page).toHaveURL(isPhone(info) ? "/people" : "about:blank");
});

test("Back after saving a form doesn't reopen it", async ({ page }, info) => {
  const name = "Jordan";
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  const profile = new URL(page.url()).pathname;

  await follow(page, `${profile}/edit`);
  await field(page, "Name").fill("Jordy");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(profile);

  await page.goBack();
  await expect(page).not.toHaveURL(/\/edit$/);
  if (isPhone(info)) await expect(page).toHaveURL("/people");
});

test("Back after deleting doesn't return to what was deleted", async ({ page }) => {
  const name = "Ravi";
  await addPerson(page, name);
  const profile = await openProfile(page, name);
  await follow(page, `${profile}/edit`);
  await confirmDelete(page, `Delete ${name}`);
  await expect(page).toHaveURL("/people");
  await page.goBack();
  await expect(page).not.toHaveURL(new RegExp(profile));
});

test("a missing page offers a way back to People that leaves no trail", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByText("This page doesn't exist.", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Go to people" }).click();
  await expect(page).toHaveURL("/people");
  await page.goBack();
  await expect(page).toHaveURL("about:blank");
});

test("on desktop, the panel's ✕ closes what's beside the list", async ({ page }, info) => {
  test.skip(isPhone(info), "phones show pages full screen, closed with Back instead");
  const name = "Ines";
  await addPerson(page, name);
  await open(page, name);
  await expect(page).toHaveURL(/\/people\/\d+$/);
  await page.getByRole("link", { name: "Back to people" }).or(page.locator('a[aria-label][href="/people"]')).filter({ visible: true }).first().click();
  await expect(page).toHaveURL("/people");
});
