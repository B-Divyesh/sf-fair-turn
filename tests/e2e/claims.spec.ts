import { expect, test, type Download, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function downloadText(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function storedBoard(page: Page, databaseName = 'fair-turn-demo'): Promise<Record<string, unknown>> {
  return page.evaluate((name) => new Promise((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('household', 'readonly').objectStore('household').get('current');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    };
  }), databaseName);
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted && character === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if (character === '\n' && !quoted) { row.push(field); rows.push(row); row = []; field = ''; }
    else field += character;
  }
  row.push(field); rows.push(row);
  return rows;
}

test('@claim:demo-sandbox keeps sample changes separate from real data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Juniper House · current board')).toBeVisible();
  await expect(page.locator('.assignment-card')).toHaveCount(3);
  await expect(page.locator('.assignment-card').first().getByText('Avery', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'People & away' }).click();
  await expect(page.getByText('Visiting family')).toBeVisible();
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.locator('.history-list li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Board' }).click();
  await page.getByRole('button', { name: /Mark done/ }).first().click();
  await expect(page.locator('.assignment-card').first().getByText('Morgan', { exact: true })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.locator('.assignment-card')).toHaveCount(3);
  await expect(page.locator('.assignment-card').first().getByText('Avery', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.getByLabel('What should we call this household?').fill('Private Flat');
  await page.getByLabel('Who shares the rotation?').fill('Sam, Alex');
  await page.getByRole('button', { name: /Make our board/ }).click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Demo' }).click();
  await page.getByRole('button', { name: /Mark done/ }).first().click();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'People & away' }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
  await expect(page.getByText('Avery', { exact: true })).toHaveCount(0);
});

test('@claim:rotation-away rotates a completed chore and skips a dated absence', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Avery', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'People & away' }).click();
  const addAway = page.getByRole('button', { name: /Add away dates/ });
  await addAway.click();
  const awayPerson = page.getByLabel('Who is away?');
  if (!await awayPerson.isVisible()) await addAway.click();
  await awayPerson.selectOption({ label: 'Morgan' });
  const end = new Date(); end.setDate(end.getDate() + 14);
  await page.getByLabel('Through').fill(end.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Skip turns in this range' }).click();
  await page.getByRole('button', { name: 'Board' }).click();
  await page.getByRole('button', { name: /Mark done/ }).first().click();
  await expect(page.getByText('Riley', { exact: true }).first()).toBeVisible();
});

test('@claim:exports preserves every board field and imports it in a fresh browser', async ({ page, browser }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'People & away' }).click();
  await page.getByRole('button', { name: /Add person/ }).click();
  await page.getByLabel('Name').fill('Noor');
  await page.getByRole('button', { name: 'Add person' }).last().click();
  await page.getByRole('button', { name: 'Own your data' }).click();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export backup/ }).click();
  const jsonText = await downloadText(await jsonDownload);
  const json = JSON.parse(jsonText);
  const source = await storedBoard(page);
  expect(json).toEqual(source);
  expect(json.householdName).toBe('Juniper House');
  expect(json.people.map((person: { name: string }) => person.name)).toEqual(['Avery', 'Morgan', 'Riley', 'Noor']);
  expect(json.chores).toHaveLength(3);
  expect(json.absences).toHaveLength(1);
  expect(json.activity).toHaveLength(3);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export activity CSV' }).click();
  const csv = parseCsv(await downloadText(await csvDownload));
  expect(csv[0]).toEqual(['date', 'action', 'chore', 'person', 'from', 'to', 'due', 'note']);
  expect(csv.slice(1)).toEqual(json.activity.map((item: Record<string, string>) => [
    item.at, item.type, item.choreTitle ?? '', item.personName ?? '', item.fromPersonName ?? '',
    item.toPersonName ?? '', item.due ?? '', item.note ?? '',
  ]));

  const targetContext = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  const target = await targetContext.newPage();
  await target.goto('/demo');
  await target.getByRole('button', { name: 'Own your data' }).click();
  target.once('dialog', (dialog) => dialog.accept());
  await target.locator('#import-file').setInputFiles({ name: 'fair-turn-backup.json', mimeType: 'application/json', buffer: Buffer.from(jsonText) });
  await expect(target.getByRole('heading', { level: 1, name: 'Here’s the next turn.' })).toBeFocused();
  await target.getByRole('button', { name: 'People & away' }).click();
  await expect(target.getByText('Noor', { exact: true })).toBeVisible();
  const restored = await storedBoard(target);
  expect({ ...restored, revision: json.revision, updatedAt: json.updatedAt }).toEqual(json);
  await targetContext.close();
});

test('@claim:share-snapshot creates a read-only board link with no history', async ({ page, context }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: /Share board/ }).click();
  const url = await page.getByLabel('Board link').inputValue();
  expect(url).toContain('#board=');
  const shared = await context.newPage();
  await shared.goto(url);
  await expect(shared.getByText('Shared snapshot · read only')).toBeVisible();
  await expect(shared.getByText('Take bins out')).toBeVisible();
  await expect(shared.getByRole('button', { name: /Mark done/ })).toHaveCount(0);
  await expect(shared.getByText('Swapped for the school run')).toHaveCount(0);
});

test('@claim:privacy-local-only sends no household data off origin in demo', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') external.push(request.url());
  });
  await page.goto('/demo');
  await page.getByRole('button', { name: /Mark done/ }).first().click();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('link', { name: /sign in|log in|account/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /sign in|log in|account|score|points/i })).toHaveCount(0);
  expect(external).toEqual([]);
});

test('@claim:offline-reload works offline after the first demo visit', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4173' });
  const page = await context.newPage();
  try {
    await page.goto('/demo');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Juniper House · current board')).toBeVisible();
    await expect(page.getByText(/Offline — everything still works/)).toBeVisible();
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test('@claim:free-limits enforces free limits and a verified Plus license removes them', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'People & away' }).click();
  await page.getByRole('button', { name: /Add person/ }).click();
  await page.getByLabel('Name').fill('Kai');
  await page.getByRole('button', { name: 'Add person' }).last().click();
  await page.getByRole('button', { name: /Add person/ }).click();
  await expect(page.getByText('Fair Turn Plus').first()).toBeVisible();
  await expect(page.getByText(/free board includes 4 people/)).toBeVisible();
  await page.getByRole('button', { name: 'Chores' }).click();
  for (const title of ['Sweep entry', 'Wipe counters', 'Sort recycling']) {
    await page.getByRole('button', { name: /Add a chore/ }).click();
    await page.getByLabel('Chore name').fill(title);
    await page.getByRole('button', { name: 'Assign first turn' }).click();
  }
  await page.getByRole('button', { name: /Add a chore/ }).click();
  await expect(page.getByText(/free board includes 6 chores/)).toBeVisible();
  await expect(page.getByText('$12 one-time purchase')).toBeVisible();

  await page.route('https://api.sociobot.in/api/v1/products/fair-turn/verify?license=fixture-license-valid', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'Access-Control-Allow-Origin': 'http://127.0.0.1:4173' },
    body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }),
  }));
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.getByLabel('What should we call this household?').fill('Five Oaks');
  await page.getByLabel('Who shares the rotation?').fill('Ana, Bo, Cy, Dev');
  await page.getByRole('button', { name: /Make our board/ }).click();
  await page.getByRole('button', { name: 'Own your data' }).click();
  await page.getByLabel('Have a license? Paste it here').fill('fixture-license-valid');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByText('Plus is active')).toBeVisible();

  await page.getByRole('button', { name: 'People & away' }).click();
  await page.getByRole('button', { name: /Add person/ }).click();
  await page.getByLabel('Name').fill('Em');
  await page.getByRole('button', { name: 'Add person' }).last().click();
  await expect(page.getByText('Em', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Chores' }).click();
  for (let index = 1; index <= 7; index += 1) {
    await page.getByRole('button', { name: /Add a chore/ }).click();
    await page.getByLabel('Chore name').fill(`Weekly chore ${index}`);
    await page.getByRole('button', { name: 'Assign first turn' }).click();
  }
  await expect(page.locator('.chore-list article')).toHaveCount(7);
  await page.getByRole('button', { name: 'Board' }).click();
  await expect(page.getByRole('heading', { name: 'Upcoming assignments' })).toBeVisible();
  const finalOutlookDate = await page.locator('.outlook-list time').evaluateAll((times) => times.map((time) => time.getAttribute('datetime') ?? '').sort().at(-1));
  const expectedHorizon = new Date();
  expectedHorizon.setDate(expectedHorizon.getDate() + 55);
  expect(finalOutlookDate).toBeTruthy();
  expect(finalOutlookDate! >= expectedHorizon.toISOString().slice(0, 10)).toBe(true);
});

test('@claim:installable-pwa exposes an install manifest and active service worker', async ({ page }) => {
  await page.goto('/demo');
  const manifest = await page.evaluate(async () => fetch('/manifest.webmanifest').then((response) => response.json()));
  expect(manifest.display).toBe('standalone');
  expect(manifest.icons.some((entry: { sizes: string; purpose?: string }) => entry.sizes === '512x512' && entry.purpose?.includes('maskable'))).toBe(true);
  const registration = await page.evaluate(async () => {
    const ready = await navigator.serviceWorker.ready;
    return { scope: ready.scope, controlled: Boolean(navigator.serviceWorker.controller) };
  });
  expect(registration.scope).toBe('http://127.0.0.1:4173/');
});

test('@claim:accessible-layout supports keyboard, reduced motion, dark theme, and 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await page.goto('/demo');
  expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  for (let index = 0; index < 20; index += 1) {
    if (await page.getByRole('button', { name: 'People & away' }).evaluate((button) => button === document.activeElement)) break;
    await page.keyboard.press('Tab');
  }
  await expect(page.getByRole('button', { name: 'People & away' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Who can take a turn?' })).toBeFocused();
  await expect(page.locator('#view-status')).toHaveText('Who can take a turn? opened.');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Chores' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'Recurring chores' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: /Add a chore/ })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Chore name')).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Add a recurring chore' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Add a chore/ })).toBeFocused();
  const darkResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(darkResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  await page.getByRole('button', { name: 'Change color theme' }).click();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('light');
  const lightResults = await new AxeBuilder({ page: page as never }).analyze();
  expect(lightResults.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
