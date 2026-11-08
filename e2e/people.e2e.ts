import { addPerson, confirmDelete, editor, expect, field, follow, mention, openProfile, test } from "./helpers";

test("a new person keeps how close they are and their type", async ({ page }) => {
  const name = "Maya";
  await page.goto("/people");
  await follow(page, "/people/new");
  await field(page, "Name").fill(name);
  await page.getByText("Close", { exact: true }).click();
  await page.getByRole("button", { name: "Choose a type" }).click();
  await page.getByRole("button", { name: /Coworker/ }).click();
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(page).toHaveURL("/people");

  await openProfile(page, name);
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByText("Close", { exact: true }).filter({ visible: true })).toBeVisible();
  await follow(page, `${new URL(page.url()).pathname}/edit`);
  await expect(page.getByRole("button", { name: /Coworker/ }).filter({ visible: true }).first()).toBeVisible();
});

test("your own relationship types can be added, renamed and deleted", async ({ page }) => {
  const type = "Climbing";
  const renamed = "Bouldering";
  await page.goto("/people");
  await follow(page, "/people/new");
  await page.getByRole("button", { name: "Choose a type" }).click();

  await page.getByRole("button", { name: "New type" }).click();
  await page.getByLabel("Its emoji").fill("🧗");
  await page.getByLabel("Type name").fill(type);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(type) }).first()).toBeVisible();

  await page.getByRole("button", { name: new RegExp(type) }).first().click(); // open the list again
  await page.getByRole("button", { name: `Edit ${type}` }).click();
  await page.getByLabel("Type name").fill(renamed);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(renamed) }).first()).toBeVisible();

  await page.getByRole("button", { name: `Edit ${renamed}` }).click();
  await page.getByRole("button", { name: "Delete type" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: `Edit ${renamed}` })).toHaveCount(0);
});

test("a person's edit form shows what was last saved", async ({ page }) => {
  const name = "Sam";
  await addPerson(page, name);
  const profile = await openProfile(page, name);
  for (const next of ["Sammy", "Samuel"]) {
    await follow(page, `${profile}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(profile);
  }
  await follow(page, `${profile}/edit`);
  await expect(field(page, "Name")).toHaveValue("Samuel");
});

test("dragging someone to another tier moves them there", async ({ page }) => {
  const name = "Omar";
  await addPerson(page, name); // new people start as acquaintances
  const bubble = page.locator("a", { hasText: name }).filter({ visible: true }).first();
  const target = page.getByText(/^Inner circle · \d+$/).filter({ visible: true });
  const from = (await bubble.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // A small move first, while still over the bubble, as a hand would; that's what picks it up.
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 10);
  await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText(/^Inner circle · \d+$/).filter({ visible: true })).not.toHaveText("Inner circle · 0");

  await page.reload();
  await openProfile(page, name);
  await expect(page.getByText("Inner circle", { exact: true }).filter({ visible: true })).toBeVisible();
});

test("a tier's list shows everyone in it", async ({ page }) => {
  const name = "Lee";
  await addPerson(page, name);
  await page.goto("/people/tiers/4");
  await expect(page.getByRole("listitem").filter({ hasText: name }).filter({ visible: true })).toBeVisible();
});

test("deleting a person keeps their moments", async ({ page }) => {
  const name = "Noor";
  const moment = "Dinner with";
  await addPerson(page, name);
  await page.goto("/journal");
  await follow(page, "/write");
  await editor(page).click();
  await page.keyboard.type(`${moment} `);
  await mention(page, "@", name);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  const profile = await openProfile(page, name);
  await follow(page, `${profile}/edit`);
  await confirmDelete(page, `Delete ${name}`);
  await expect(page).toHaveURL("/people");
  await expect(page.locator("a", { hasText: name }).filter({ visible: true })).toHaveCount(0);
  await page.goto("/journal");
  await expect(page.getByText(moment).filter({ visible: true })).toBeVisible();
});
