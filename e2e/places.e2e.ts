import type { Page } from "@playwright/test";
import { addPerson, confirmDelete, expect, field, follow, link, test } from "./helpers";

// Address search is Photon on the internet, so it's answered here with one made-up result.
async function fakeSearch(page: Page, name: string) {
  await page.route("https://photon.komoot.io/api/**", (route) =>
    route.fulfill({
      json: { features: [{ geometry: { coordinates: [-122.319, 47.617] }, properties: { name, street: "11th Ave", housenumber: "1635", district: "Capitol Hill", city: "Seattle" } }] },
    }),
  );
}

test("a place is added from a search, shown on the map, edited and deleted", async ({ page }) => {
  await addPerson(page, "Jordan");
  await fakeSearch(page, "Cal Anderson Park");

  await page.goto("/places");
  await follow(page, /^Add (a )?place$/, "/places/new"); // phones say "Add a place", desktop "Add place"
  await page.getByLabel("Search an address or place").fill("cal anderson");
  await page.getByRole("button", { name: /Cal Anderson Park/ }).click();
  await field(page, "Cal Anderson Park").fill("The park"); // the nickname, hinting the place's own name
  await page.getByRole("button", { name: "someone" }).click();
  await page.getByPlaceholder("Search people").fill("Jordan");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Add place" }).click();
  await expect(page).toHaveURL("/places");

  // Its pin selects it, which shows who goes there.
  await page.getByRole("button", { name: "The park, 1 person" }).click();
  await expect(page).toHaveURL(/\/places\?place=\d+$/);
  const id = new URL(page.url()).searchParams.get("place");
  await expect(link(page, /Jordan/)).toBeVisible();

  await follow(page, /^Edit( place)?$/, `/places/${id}/edit`); // "Edit" in the phone's sheet, "Edit place" in the list
  await field(page, "Cal Anderson Park").fill("Sunday park");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL("/places");
  await expect(page.getByRole("button", { name: "Sunday park, 1 person" })).toBeVisible();

  await page.goto(`/places/${id}/edit`);
  await confirmDelete(page, "Delete place");
  await expect(page).toHaveURL("/places");
  await expect(page.getByRole("button", { name: /^Sunday park/ })).toHaveCount(0);
});
