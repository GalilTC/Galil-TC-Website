// The closed pilot: config.js → PORTAL_CONFIG.pilot lets only the listed people in.
const { test, expect } = require("@playwright/test");

const open = async page => {
  await page.addInitScript(() => { try { localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })); } catch (e) {} });
  await page.goto(test.info().project.use.baseURL);
  await expect(page.locator("#si-email")).toBeVisible();
};
const signIn = async (page, email) => {
  await page.fill("#si-email", email); await page.fill("#si-pw", "GalilWorkdesk1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
};

for (const email of ["tamir@galiltc.co.il", "inon.kanner@galiltc.co.il", "danny.gelman@galiltc.co.il", "daniel.barak@galiltc.co.il"]) {
  test("pilot member " + email + " gets into the portal", async ({ page }) => {
    await open(page);
    await signIn(page, email);
    await expect(page.getByText("Signed in as")).toBeVisible();
    await expect(page.getByText("The portal is in a closed pilot.")).toHaveCount(0);
  });
}

test("someone outside the pilot is stopped, also in Taskana and HR", async ({ page }) => {
  await open(page);
  const outsider = await page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data.users
    .find(u => u.isActive && PORTAL_CONFIG.pilot.indexOf(u.email) < 0).email);
  await signIn(page, outsider);
  await expect(page.getByText("The portal is in a closed pilot.")).toBeVisible();
  expect(await page.evaluate(() => GalilPortal.sessionUser())).toBeNull();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator("#si-email")).toBeVisible();
});
