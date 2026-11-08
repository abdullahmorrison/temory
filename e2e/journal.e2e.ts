import { longDate, localToday } from "../lib/dates";
import { addActivity, addPerson, confirmDelete, editor, expect, follow, logMoment, mention, open, openProfile, test } from "./helpers";

test("mentions file a moment under that person and activity", async ({ page }) => {
  await addPerson(page, "Priya");
  const climbing = await addActivity(page, "Climbing");

  await page.goto("/journal");
  await follow(page, "Log a moment", "/write");
  await editor(page).click();
  await page.keyboard.type("Sent the blue route with ");
  await mention(page, "@", "Priya");
  await page.keyboard.type("at ");
  await mention(page, "/", "Climbing");
  await expect(page.getByRole("button", { name: "Keep Priya in this moment" })).toBeVisible();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");
  await expect(page.getByText("Sent the blue route").filter({ visible: true })).toBeVisible();

  // On the person's profile and their list of moments, and opened from there in their panel.
  const profile = await openProfile(page, "Priya");
  await expect(page.getByText("Sent the blue route").filter({ visible: true })).toBeVisible();
  await page.goto(`${profile}/moments`);
  await open(page, "Sent the blue route");
  await expect(page).toHaveURL(new RegExp(`${profile}/moments/\\d+`));
  await expect(editor(page)).toContainText("Sent the blue route");

  // On the activity's page and its list of moments.
  await page.goto(climbing);
  await expect(page.getByText("Sent the blue route").filter({ visible: true })).toBeVisible();
  await page.goto(`${climbing}/moments`);
  await open(page, "Sent the blue route");
  await expect(page).toHaveURL(new RegExp(`${climbing}/moments/\\d+`));
});

test("a moment can be dated another day", async ({ page }) => {
  await page.goto("/journal");
  await follow(page, "Log a moment", "/write");
  await page.getByRole("button", { name: longDate(localToday()), expanded: false }).click();
  const picker = page.getByRole("dialog", { name: "Pick a date" });
  await picker.getByRole("button", { name: "Previous month" }).click();
  const day = picker.getByRole("button", { name: /\s1$/ });
  const picked = (await day.getAttribute("aria-label"))!;
  await day.click();
  await editor(page).click();
  await page.keyboard.type("Picnic");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await open(page, "Picnic");
  await expect(page.getByRole("button", { name: picked, expanded: false })).toBeVisible();
});

test("a moment's edit survives reopening and saving it again", async ({ page }) => {
  await page.goto("/journal");
  await logMoment(page, "Rough day");

  await open(page, "Rough day");
  await editor(page).click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.type("Good day");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await open(page, "Good day");
  await expect(editor(page)).toHaveText("Good day");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await page.reload();
  await expect(page.getByText("Good day").filter({ visible: true })).toBeVisible();
  await expect(page.getByText("Rough day")).toHaveCount(0);
});

test("logging a want-to activity can move it to Doing", async ({ page }) => {
  await addActivity(page, "Pottery", "Want to");
  await page.goto("/journal");
  await follow(page, "Log a moment", "/write");
  await editor(page).click();
  await page.keyboard.type("Threw a bowl at ");
  await mention(page, "/", "Pottery");
  await expect(page.getByText("Pottery is on your want-to list.")).toBeVisible();
  await page.getByRole("button", { name: "Yes, I do it now" }).click();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  await page.goto("/activities");
  await expect(page.getByRole("link", { name: /Pottery/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "Want to" })).toHaveCount(0); // it was the only one
});

test("a deleted moment leaves the journal", async ({ page }) => {
  await page.goto("/journal");
  await logMoment(page, "Forgettable");
  await open(page, "Forgettable");
  await confirmDelete(page, "Delete this moment");
  await expect(page).toHaveURL("/journal");
  await expect(page.getByText("Forgettable").filter({ visible: true })).toHaveCount(0);
});

test("a second moment can be logged right after the first", async ({ page }) => {
  // Next keeps the form's page alive after it saves. Reopened, it must start empty and stay open to type in.
  await page.goto("/journal");
  await logMoment(page, "Coffee");
  await follow(page, "Log a moment", "/write");
  await expect(editor(page)).toHaveText("");
  await editor(page).click();
  await page.keyboard.type("Lunch");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");
  await expect(page.getByText("Coffee").filter({ visible: true })).toBeVisible();
  await expect(page.getByText("Lunch").filter({ visible: true })).toBeVisible();
});
