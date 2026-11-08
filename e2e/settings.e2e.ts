import { expect, test } from "./helpers";

test("the theme picked in Settings sticks", async ({ page }) => {
  await page.goto("/settings");
  const html = page.locator("html");
  await page.getByRole("radiogroup", { name: "Theme" }).getByText("Dark").click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("radiogroup", { name: "Theme" }).getByText("System").click();
  await expect(html).not.toHaveAttribute("data-theme", /./);
});
