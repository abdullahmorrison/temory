import { addPerson, confirmDelete, editor, expect, field, follow, link, mention, openProfile, test } from "./helpers";

test("a new person keeps how close they are and their type", async ({ page }) => {
  await page.goto("/people");
  await follow(page, "Add person", "/people/new");
  await field(page, "Name").fill("Maya");
  await page.getByText("Close", { exact: true }).click();
  await page.getByRole("button", { name: "Choose a type", expanded: false }).click();
  await page.getByRole("button", { name: /Coworker/, pressed: false }).click();
  await page.getByRole("button", { name: "Add person" }).click();
  await expect(page).toHaveURL("/people");

  const profile = await openProfile(page, "Maya");
  await expect(page.getByRole("heading", { name: "Maya" })).toBeVisible();
  await expect(page.getByText("Close", { exact: true }).filter({ visible: true })).toBeVisible();
  await follow(page, "Edit", `${profile}/edit`);
  await expect(page.getByRole("button", { name: /Coworker/, expanded: false }).filter({ visible: true })).toBeVisible();
});

test("your own relationship types can be added, renamed and deleted", async ({ page }) => {
  await page.goto("/people");
  await follow(page, "Add person", "/people/new");
  const picker = page.getByRole("button", { name: /Choose a type|Climbing|Bouldering/, expanded: false });
  await picker.click();

  await page.getByRole("button", { name: "New type" }).click();
  await page.getByLabel("Its emoji").fill("🧗");
  await page.getByLabel("Type name").fill("Climbing");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(picker).toHaveAccessibleName(/Climbing/); // picked, and the list closed

  await picker.click();
  await page.getByRole("button", { name: "Edit Climbing" }).click();
  await page.getByLabel("Type name").fill("Bouldering");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Bouldering" })).toBeVisible();

  await page.getByRole("button", { name: "Edit Bouldering" }).click();
  await page.getByRole("button", { name: "Delete type" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit Bouldering" })).toHaveCount(0);
});

test("a person's edit form shows what was last saved", async ({ page }) => {
  await addPerson(page, "Sam");
  const profile = await openProfile(page, "Sam");
  for (const next of ["Sammy", "Samuel"]) {
    await follow(page, "Edit", `${profile}/edit`);
    await field(page, "Name").fill(next);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(profile);
  }
  await follow(page, "Edit", `${profile}/edit`);
  await expect(field(page, "Name")).toHaveValue("Samuel");
});

test("dragging someone to another tier moves them there", async ({ page }) => {
  await addPerson(page, "Omar"); // new people start as acquaintances
  const from = (await link(page, /Omar/).boundingBox())!;
  const to = (await page.getByText(/^Inner circle · \d+$/).filter({ visible: true }).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  // A small move first, while still over the bubble, as a hand would; that's what picks it up.
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 10);
  await page.mouse.move(to.x + to.width / 2, to.y + 40, { steps: 12 });
  await page.mouse.up();
  await expect(page.getByText(/^Inner circle · \d+$/).filter({ visible: true })).toHaveText("Inner circle · 1");

  await page.reload();
  await openProfile(page, "Omar");
  await expect(page.getByText("Inner circle", { exact: true }).filter({ visible: true })).toBeVisible();
});

test("a tier's list shows everyone in it", async ({ page }) => {
  await addPerson(page, "Lee");
  await page.goto("/people/tiers/4");
  await expect(page.getByRole("listitem").filter({ hasText: "Lee" }).filter({ visible: true })).toBeVisible();
});

test("deleting a person keeps their moments", async ({ page }) => {
  await addPerson(page, "Noor");
  await page.goto("/journal");
  await follow(page, "Log a moment", "/write");
  await editor(page).click();
  await page.keyboard.type("Dinner with ");
  await mention(page, "@", "Noor");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/journal");

  const profile = await openProfile(page, "Noor");
  await follow(page, "Edit", `${profile}/edit`);
  await confirmDelete(page, "Delete Noor");
  await expect(page).toHaveURL("/people");
  await expect(link(page, /Noor/)).toHaveCount(0);
  await page.goto("/journal");
  await expect(page.getByText("Dinner with").filter({ visible: true })).toBeVisible();
});
