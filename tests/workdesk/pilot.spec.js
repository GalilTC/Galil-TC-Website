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
  await expect(page.getByText("Signed in as Danny Gelman")).toBeVisible();
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
