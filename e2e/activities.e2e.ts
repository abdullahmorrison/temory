import { addActivity, confirmDelete, expect, field, follow, test } from "./helpers";

test("activities are grouped as Doing, Want to and Past", async ({ page }) => {
  const doing = "Chess";
  const want = "Surfing";
  const past = "Rugby";
  await addActivity(page, doing);
  await addActivity(page, want, "Want to");
  await addActivity(page, past, "Past");

  await page.goto("/activities");
  await expect(page.locator("section", { hasText: /^Want to/ }).filter({ visible: true }).getByText(want)).toBeVisible();
  const pastGroup = page.locator("details", { hasText: /^Past/ }).filter({ visible: true });
  await expect(pastGroup.getByText(past)).toBeHidden(); // folded away
  await pastGroup.locator("summary").click();
  await expect(pastGroup.getByText(past)).toBeVisible();
  await expect(page.locator("section", { hasText: /^Want to/ }).filter({ visible: true }).getByText(doing)).toHaveCount(0);
});

test("the switch on an activity's page saves its status", async ({ page }) => {
  const activity = await addActivity(page, "Hiking");
  await page.getByRole("radio", { name: "Past" }).click();
  await expect(page.getByRole("radio", { name: "Past" })).toHaveAttribute("aria-checked", "true");
  await page.reload();
  await expect(page.getByRole("radio", { name: "Past" })).toHaveAttribute("aria-checked", "true");
  await expect(page).toHaveURL(activity);
});

test("a status change that can't save says so and snaps back", async ({ page, context }) => {
  const name = "Darts";
  const activity = await addActivity(page, name);
  const other = await context.newPage();
  await other.goto(`${activity}/edit`);
  await confirmDelete(other, `Delete ${name}`);
  await expect(other).toHaveURL("/activities");

  await page.getByRole("radio", { name: "Want to" }).click();
  await expect(page.getByText("Couldn't save. This activity no longer exists.")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Doing" })).toHaveAttribute("aria-checked", "true");
});

test("an activity's edit form shows what was last saved", async ({ page }) => {
  const activity = await addActivity(page, "Chess");
  for (const next of ["Blitz", "Bughouse"]) {
    await follow(page, `${activity}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(activity);
    await expect(page.getByRole("heading", { name: next })).toBeVisible();
  }
  await follow(page, `${activity}/edit`);
  await expect(field(page, "Name")).toHaveValue("Bughouse");
});

test("a deleted activity leaves the list", async ({ page }) => {
  const name = "Bowling";
  const activity = await addActivity(page, name);
  await follow(page, `${activity}/edit`);
  await confirmDelete(page, `Delete ${name}`);
  await expect(page).toHaveURL("/activities");
  await expect(page.getByText(name).filter({ visible: true })).toHaveCount(0);
});
