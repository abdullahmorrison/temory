import { addActivity, confirmDelete, expect, field, follow, link, test } from "./helpers";

test("activities are grouped as Doing, Want to and Past", async ({ page }) => {
  await addActivity(page, "Chess");
  await addActivity(page, "Surfing", "Want to");
  await addActivity(page, "Rugby", "Past");

  await page.goto("/activities");
  const want = page.getByRole("region", { name: "Want to" });
  const past = page.getByRole("group", { name: "Past" });
  await expect(want.getByRole("link", { name: /Surfing/ })).toBeVisible();
  await expect(want.getByRole("link", { name: /Chess/ })).toHaveCount(0);
  await expect(past.getByRole("link", { name: /Rugby/ })).toBeHidden(); // folded away
  await past.getByText(/^Past · 1$/).click();
  await expect(past.getByRole("link", { name: /Rugby/ })).toBeVisible();
});

test("the switch on an activity's page saves its status", async ({ page }) => {
  const hiking = await addActivity(page, "Hiking");
  await page.getByRole("radio", { name: "Past" }).click();
  await expect(page.getByRole("radio", { name: "Past" })).toBeChecked();
  await page.reload();
  await expect(page).toHaveURL(hiking);
  await expect(page.getByRole("radio", { name: "Past" })).toBeChecked();
});

test("a status change that can't save says so and snaps back", async ({ page, context }) => {
  const darts = await addActivity(page, "Darts");
  const other = await context.newPage();
  await other.goto(`${darts}/edit`);
  await confirmDelete(other, "Delete Darts");
  await expect(other).toHaveURL("/activities");

  await page.getByRole("radio", { name: "Want to" }).click();
  await expect(page.getByText("Couldn't save. This activity no longer exists.")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Doing" })).toBeChecked();
});

test("an activity's edit form shows what was last saved", async ({ page }) => {
  const chess = await addActivity(page, "Chess");
  for (const next of ["Blitz", "Bughouse"]) {
    await follow(page, "Edit", `${chess}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(chess);
    await expect(page.getByRole("heading", { name: next })).toBeVisible();
  }
  await follow(page, "Edit", `${chess}/edit`);
  await expect(field(page, "Name")).toHaveValue("Bughouse");
});

test("a deleted activity leaves the list", async ({ page }) => {
  const bowling = await addActivity(page, "Bowling");
  await follow(page, "Edit", `${bowling}/edit`);
  await confirmDelete(page, "Delete Bowling");
  await expect(page).toHaveURL("/activities");
  await expect(link(page, /Bowling/)).toHaveCount(0);
});
