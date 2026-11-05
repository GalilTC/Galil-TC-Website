// The closed pilot: config.js → PORTAL_CONFIG.pilot lets only the listed people in.
const { test, expect } = require("@playwright/test");

const open = async page => {
  await page.addInitScript(() => { try { localStorage.setItem("galil-workdesk-config", JSON.stringify({ storage: "local" })); } catch (e) {} });
  await page.goto(test.info().project.use.baseURL);
  await expect(page.locator("#si-email")).toBeVisible();
};
const signIn = async (page, email, pw) => {
  await page.fill("#si-email", email); await page.fill("#si-pw", pw || "GalilWorkdesk1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
};
const NEW_PW = "Defense-Pilot-2026";
const choose = async (page, pw) => {
  await page.fill("#cp-new", pw); await page.fill("#cp-new2", pw); await page.click("#cp-save");
  await expect(page.locator("#cp-save")).toHaveCount(0);
};
const users = page => page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data.users);

for (const email of ["tamir@galiltc.co.il", "inon.kanner@galiltc.co.il", "danny.gelman@galiltc.co.il", "daniel.barak@galiltc.co.il"]) {
  test("pilot member " + email + " gets into the portal", async ({ page }) => {
    await open(page);
    await signIn(page, email);
    await expect(page.getByText("Choose your own password")).toBeVisible();
    await choose(page, NEW_PW);
    await expect(page.locator("#tile-workdesk")).toBeVisible();
    await expect(page.getByText("The portal is in a closed pilot.")).toHaveCount(0);
  });
}

test("someone outside the pilot is stopped, also in Taskana and HR", async ({ page }) => {
  await open(page);
  /* someone added to WorkDesk later, outside the pilot list */
  await page.addInitScript(() => {
    const o = JSON.parse(localStorage.getItem("galil-workdesk-v1") || "null");
    if (!o || o.data.users.some(u => u.id === "u-outsider")) return;
    o.data.users.push(Object.assign({}, o.data.users.find(u => u.id === "u-daniel"), { id: "u-outsider", email: "someone.else@galiltc.co.il", fullName: "Someone Else" }));
    localStorage.setItem("galil-workdesk-v1", JSON.stringify(o));
  });
  await page.reload();
  await expect(page.locator("#si-email")).toBeVisible();
  await signIn(page, "someone.else@galiltc.co.il");
  await expect(page.getByText("The portal is in a closed pilot.")).toBeVisible();
  expect(await page.evaluate(() => GalilPortal.sessionUser())).toBeNull();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.locator("#si-email")).toBeVisible();
});

test("a fresh start has the four pilot people and no demo work, tasks or HR posts", async ({ page }) => {
  await open(page);
  await signIn(page, "danny.gelman@galiltc.co.il");
  await choose(page, NEW_PW);
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem("galil-workdesk-v1")).data);
  expect(d.users.map(u => u.email).sort()).toEqual(["daniel.barak@galiltc.co.il", "danny.gelman@galiltc.co.il", "inon.kanner@galiltc.co.il", "tamir@galiltc.co.il"]);
  expect(d.users.find(u => u.id === "u-inon").jobTitle).toBe("Chief Operating Officer & Head of Business Division");
  expect(d.users.find(u => u.id === "u-danny").jobTitle).toBe("Project Manager");
  expect(d.users.find(u => u.id === "u-daniel").jobTitle).toBe("Junior Technical Writer");
  for (const k of ["workOrders", "budgets", "entries", "expenses", "approvals"]) expect(d[k].length, k).toBe(0);
  expect(d.teams.map(t => t.id)).toEqual(["team-def"]);
  expect(d.clients.every(c => !c.demo)).toBe(true);

  await page.goto(test.info().project.use.baseURL.replace("index.html", "taskana/index.html"));
  await page.waitForTimeout(1500);
  const t = await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/taskana/i.test(k)) { try { const o = JSON.parse(localStorage.getItem(k)); const dd = o.data || o; if (dd && dd.tasks) return dd.tasks.length; } catch (e) {} } return 0; });
  expect(t).toBe(0);

  await page.goto(test.info().project.use.baseURL.replace("index.html", "hr/index.html"));
  await page.waitForTimeout(1500);
  const n = await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (/hr/i.test(k)) { try { const o = JSON.parse(localStorage.getItem(k)); const dd = o.data || o; if (dd && dd.news) return dd.news.length; } catch (e) {} } return 0; });
  expect(n).toBe(0);
});

test("passwords: no Microsoft button, chosen at the first sign-in, kept hashed, renewed after 90 days", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("button", { name: /Sign in with Microsoft/ })).toHaveCount(0);
  await expect(page.getByText("Demo accounts")).toHaveCount(0);
  await signIn(page, "daniel.barak@galiltc.co.il");
  await expect(page.getByText("Choose your own password")).toBeVisible();
  await page.fill("#cp-new", "short"); await page.fill("#cp-new2", "short"); await page.click("#cp-save");
  await expect(page.getByText("Minimum 12 characters.")).toBeVisible();
  await page.fill("#cp-new", "GalilWorkdesk1x"); await page.fill("#cp-new2", "GalilWorkdesk1y"); await page.click("#cp-save");
  await expect(page.getByText("The two passwords do not match.")).toBeVisible();
  await choose(page, NEW_PW);
  let u = (await users(page)).find(x => x.id === "u-daniel");
  expect(u.password).toBeUndefined();
  expect(u.passwordHash).toMatch(/^[0-9a-f]{64}$/);
  expect(u.passwordHash).not.toContain(NEW_PW);
  expect(u.mustChangePassword).toBe(false);

  /* signed out: the first-time password no longer works, the new one does */
  await page.evaluate(() => localStorage.removeItem("galil-workdesk-session"));
  await page.reload();
  await signIn(page, "daniel.barak@galiltc.co.il");
  await expect(page.getByText(/do not match/)).toBeVisible();
  await signIn(page, "daniel.barak@galiltc.co.il", NEW_PW);
  await expect(page.locator("#tile-workdesk")).toBeVisible();

  /* 91 days later the portal asks for a new one, and Taskana sends them back to it */
  await page.addInitScript(() => {
    const o = JSON.parse(localStorage.getItem("galil-workdesk-v1") || "null"); if (!o) return;
    const t = o.data.users.find(x => x.id === "u-daniel");
    if (t.passwordChangedAt > new Date(Date.now() - 50 * 86400000).toISOString()) { t.passwordChangedAt = new Date(Date.now() - 91 * 86400000).toISOString(); localStorage.setItem("galil-workdesk-v1", JSON.stringify(o)); }
  });
  await page.reload();
  await expect(page.getByText("Your password has expired")).toBeVisible();
  expect(await page.evaluate(() => GalilPortal.sessionUser())).toBeNull();
  await page.fill("#cp-new", NEW_PW); await page.fill("#cp-new2", NEW_PW); await page.click("#cp-save");
  await expect(page.getByText("Choose a password different from the old one.")).toBeVisible();
  await choose(page, "Another-Pilot-2027");
  await expect(page.locator("#tile-workdesk")).toBeVisible();
});

test("the CEO resets a forgotten password; the person chooses a new one at the next sign-in", async ({ page }) => {
  await open(page);
  await signIn(page, "tamir@galiltc.co.il");
  await choose(page, NEW_PW);
  await page.click("#tile-workdesk");
  await page.getByRole("tab", { name: /Management/ }).click();
  page.once("dialog", d => d.accept("Temporary-Reset-1"));
  await page.getByRole("button", { name: "Reset password for Daniel Barak" }).click();
  await expect(page.getByText(/Temporary password set/)).toBeVisible();
  const u = (await users(page)).find(x => x.id === "u-daniel");
  expect(u.mustChangePassword).toBe(true);
  expect(await page.evaluate(() => GalilPortal.sha256("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");

  await page.getByRole("button", { name: "Back to the Employee Portal home" }).click();
  await page.getByRole("button", { name: /Sign out/ }).first().click();
  await expect(page.locator("#si-email")).toBeVisible();
  await signIn(page, "daniel.barak@galiltc.co.il", "Temporary-Reset-1");
  await expect(page.getByText("Choose your own password")).toBeVisible();
  await choose(page, NEW_PW);
  await expect(page.locator("#tile-workdesk")).toBeVisible();
});
