import { expect, test } from "./helpers";

test("the theme picked in Settings sticks", async ({ page }) => {
  await page.goto("/settings");
  const theme = page.getByRole("radiogroup", { name: "Theme" });
  const html = page.locator("html"); // the theme is an attribute on the page itself
  await theme.getByText("Dark", { exact: true }).click(); // the radios are hidden behind their labels
  await expect(theme.getByRole("radio", { name: "Dark" })).toBeChecked();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await theme.getByText("System", { exact: true }).click();
  await expect(html).not.toHaveAttribute("data-theme", /./);
});
