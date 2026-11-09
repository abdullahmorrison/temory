import { addPerson, expect, follow, ME, test } from "./helpers";

// These start signed out; the account ME exists, with nothing in it.
test.use({ signedIn: false });

const email = (page: import("@playwright/test").Page) => page.getByLabel("Email").filter({ visible: true });
const password = (page: import("@playwright/test").Page) => page.getByLabel("Password", { exact: true }).filter({ visible: true });

test("signed out, every page asks to sign in first", async ({ page }) => {
  for (const path of ["/", "/people", "/journal", "/activities/new", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL("/sign-in");
  }
});

test("a wrong password says so and keeps the email; the right one signs in", async ({ page }) => {
  await page.goto("/sign-in");
  await email(page).fill("ME@example.com");
  await password(page).fill("wrong horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That email and password don't match.")).toBeVisible();
  await expect(email(page)).toHaveValue("ME@example.com");

  await password(page).fill(ME.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/people");
});

test("creating an account signs in, and each account sees only its own people", async ({ page, browser, baseURL }) => {
  // ME adds someone first, in another browser.
  const mine = await browser.newContext({ baseURL });
  const myPage = await mine.newPage();
  await myPage.goto("/sign-in");
  await email(myPage).fill(ME.email);
  await password(myPage).fill(ME.password);
  await myPage.getByRole("button", { name: "Sign in" }).click();
  await expect(myPage).toHaveURL("/people");
  await addPerson(myPage, "Priya");

  await page.goto("/sign-in");
  await follow(page, "Create an account", "/sign-up");
  await page.getByLabel("Name").filter({ visible: true }).fill("Sam Rivera");
  await email(page).fill(ME.email);
  await password(page).fill("another horse");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("There's already an account with that email. Sign in instead.")).toBeVisible();

  await email(page).fill("sam@example.com");
  await password(page).fill("another horse");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/people");
  await expect(page.getByText("0 people").filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Priya/ })).toHaveCount(0);
  await mine.close();
});

test("Sign out from Settings ends the session", async ({ page }) => {
  await page.goto("/sign-in");
  await email(page).fill(ME.email);
  await password(page).fill(ME.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/people");

  await page.goto("/settings");
  await follow(page, /Abdullah Morrison/, "/settings/account");
  await expect(page.getByText(ME.email).filter({ visible: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL("/sign-in");
  await page.goto("/people");
  await expect(page).toHaveURL("/sign-in");
});
