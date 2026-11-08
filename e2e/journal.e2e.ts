import { addActivity, addPerson, confirmDelete, editor, expect, follow, logMoment, mention, open, openProfile, test } from "./helpers";

test("mentions file a moment under that person and activity", async ({ page }) => {
  const name = "Priya";
  const activity = "Climbing";
  const text = "Sent the blue route";
  await addPerson(page, name);
  const activityPage = await addActivity(page, activity);

  await page.goto("/journal");
  await follow(page, "/write");
  await editor(page).click();
  await page.keyboard.type(`${text} with `);
  await mention(page, "@", name);
  await page.keyboard.type("at ");
  await mention(page, "/", activity);
  await expect(page.getByRole("button", { name: `Keep ${name} in this moment` })).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");
  await expect(page.getByText(text).filter({ visible: true })).toBeVisible();

  // On the person's profile and their list of moments, and opened from there in their panel.
  const profile = await openProfile(page, name);
  await expect(page.getByText(text).filter({ visible: true })).toBeVisible();
  await page.goto(`${profile}/moments`);
  await open(page, text);
  await expect(page).toHaveURL(new RegExp(`${profile}/moments/\\d+`));
  await expect(editor(page)).toContainText(text);

  // On the activity's page and its list of moments.
  await page.goto(activityPage);
  await expect(page.getByText(text).filter({ visible: true })).toBeVisible();
  await page.goto(`${activityPage}/moments`);
  await open(page, text);
  await expect(page).toHaveURL(new RegExp(`${activityPage}/moments/\\d+`));
});

test("a moment can be dated another day", async ({ page }) => {
  const text = "Picnic";
  await page.goto("/journal");
  await follow(page, "/write");
  const heading = page.locator("form button[aria-expanded]").filter({ visible: true }).first();
  await heading.click();
  const picker = page.getByRole("dialog", { name: "Pick a date" });
  await picker.getByRole("button", { name: "Previous month" }).click();
  const day = picker.getByRole("button", { name: /\s1$/ });
  const label = (await day.getAttribute("aria-label"))!;
  await day.click();
  await expect(heading).toHaveText(label);
  await editor(page).click();
  await page.keyboard.type(text);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await open(page, text);
  await expect(page.locator("form button[aria-expanded]").filter({ visible: true }).first()).toHaveText(label);
});

test("a moment's edit survives reopening and saving it again", async ({ page }) => {
  const first = "Rough day";
  const edited = "Good day";
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

test("logging a want-to activity can move it to Doing", async ({ page }) => {
  const activity = "Pottery";
  await addActivity(page, activity, "Want to");
  await page.goto("/journal");
  await follow(page, "/write");
  await editor(page).click();
  await page.keyboard.type("Threw a bowl at ");
  await mention(page, "/", activity);
  await expect(page.getByText(`${activity} is on your want-to list.`)).toBeVisible();
  await page.getByRole("button", { name: "Yes, I do it now" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await page.goto("/activities");
  const wantTo = page.locator("section", { hasText: /^Want to/ }).filter({ visible: true });
  await expect(wantTo.getByText(activity)).toHaveCount(0);
  await expect(page.getByText(activity).filter({ visible: true })).toBeVisible();
});

test("a deleted moment leaves the journal", async ({ page }) => {
  const text = "Forgettable";
  await page.goto("/journal");
  await logMoment(page, text);
  await open(page, text);
  await confirmDelete(page, "Delete this moment");
  await expect(page).toHaveURL("/journal");
  await expect(page.getByText(text).filter({ visible: true })).toHaveCount(0);
});

test("logging a second moment opens an empty form that stays open", async ({ page }) => {
  // Next keeps the form's page alive after it saves; it mustn't come back filled in, or close itself.
  await page.goto("/journal");
  await logMoment(page, "Coffee");
  await follow(page, "/write");
  await expect(editor(page)).toHaveText("");
  await page.waitForTimeout(1000); // the bug closed it a moment after opening
  await expect(page).toHaveURL("/write");
});
