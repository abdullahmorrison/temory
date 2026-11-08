import type { Page } from "@playwright/test";
import { addPerson, confirmDelete, expect, field, follow, test } from "./helpers";

// Address search is Photon on the internet, so it's answered here with one made-up result.
async function fakeSearch(page: Page, name: string) {
  const [lng, lat] = [-122.319, 47.617];
  await page.route("https://photon.komoot.io/api/**", (route) =>
    route.fulfill({
      json: { features: [{ geometry: { coordinates: [lng, lat] }, properties: { name, street: "11th Ave", housenumber: "1635", district: "Capitol Hill", city: "Seattle" } }] },
    }),
  );
}

test("a place is added from a search, shown on the map, edited and deleted", async ({ page }) => {
  const person = "Jordan";
  const address = "Cal Anderson Park";
  const nickname = "The park";
  await addPerson(page, person);
  await fakeSearch(page, address);

  await page.goto("/places");
  await follow(page, "/places/new");
  await page.getByLabel("Search an address or place").fill("cal anderson");
  await page.getByRole("button", { name: new RegExp(address) }).click();
  await field(page, address).fill(nickname);
  await page.getByRole("button", { name: "someone" }).click();
  await page.getByPlaceholder("Search people").fill(person);
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Add place" }).click();
  await expect(page).toHaveURL("/places");

  // Its pin selects it, which shows who goes there.
  await page.getByRole("button", { name: `${nickname}, 1 person` }).click();
  await expect(page).toHaveURL(/\/places\?place=\d+$/);
  const id = new URL(page.url()).searchParams.get("place");
  await expect(page.locator("a", { hasText: person }).filter({ visible: true })).toBeVisible();

  const renamed = "Sunday park";
  await follow(page, `/places/${id}/edit`);
  await field(page, address).fill(renamed);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/places");
  await expect(page.getByRole("button", { name: `${renamed}, 1 person` })).toBeVisible();

  await page.goto(`/places/${id}/edit`);
  await confirmDelete(page, "Delete place");
  await expect(page).toHaveURL("/places");
  await expect(page.getByRole("button", { name: new RegExp(`^${renamed}`) })).toHaveCount(0);
});
