import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:demo-sandbox keeps sample changes separate from real data', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What should we call this household?').fill('Private Flat');
  await page.getByLabel('Who shares the rotation?').fill('Sam, Alex');
  await page.getByRole('button', { name: /Make our board/ }).click();
  await page.goto('/demo');
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.getByText('Juniper House · current board')).toBeVisible();
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

test('@claim:exports downloads complete JSON and readable CSV', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Own your data' }).click();
  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export backup/ }).click();
  const json = JSON.parse(await (await jsonDownload).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks).toString('utf8');
  }));
  expect(json.householdName).toBe('Juniper House');
  expect(json.chores).toHaveLength(3);
  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export activity CSV' }).click();
  const csv = await (await csvDownload).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = []; for await (const chunk of stream) chunks.push(Buffer.from(chunk)); return Buffer.concat(chunks).toString('utf8');
  });
  expect(csv.split('\n')[0]).toBe('"date","action","chore","person","from","to","due","note"');
  expect(csv.split('\n')).toHaveLength(4);
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
  expect(external).toEqual([]);
});

test('@claim:offline-reload works offline after the first demo visit', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Juniper House · current board')).toBeVisible();
  await expect(page.getByText(/Offline — everything still works/)).toBeVisible();
  await context.setOffline(false);
});

test('@claim:free-limits enforces four people and six chores before Plus', async ({ page }) => {
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
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.getByRole('button', { name: 'Change color theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});
