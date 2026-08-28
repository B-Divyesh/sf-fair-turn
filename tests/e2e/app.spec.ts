import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('creates a board, skips an absence, records a swap, and works offline', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName('Rotate chores fairly at home.');
  await page.getByLabel('What should we call this household?').fill('Flat 4B');
  await page.getByLabel('Who shares the rotation?').fill('Sam, Alex, Jo');
  await page.getByRole('button', { name: /Make our board/ }).click();
  await expect(page.getByRole('heading', { name: 'No chores on the board yet.' })).toBeVisible();

  await page.getByRole('button', { name: /Add a chore/ }).first().click();
  await page.getByLabel('Chore name').fill('Take bins out');
  await page.getByRole('button', { name: 'Assign first turn' }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'People & away' }).click();
  await page.getByRole('button', { name: /Add away dates/ }).click();
  await page.getByLabel('Who is away?').selectOption({ label: 'Sam' });
  await page.getByRole('button', { name: 'Skip turns in this range' }).click();
  await page.getByRole('button', { name: 'Board' }).click();
  await expect(page.getByText('Alex', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: /Swap/ }).click();
  await page.getByLabel('Move this turn to').selectOption({ label: 'Jo' });
  await page.getByLabel(/Note/).fill('Traded for dinner');
  await page.getByRole('button', { name: 'Record swap' }).click();
  await expect(page.getByText('Jo', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Mark done/ }).click();
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText(/moved from Alex to Jo/)).toBeVisible();
  await expect(page.getByText('Traded for dinner')).toBeVisible();

  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Here’s the next turn.')).toBeVisible();
  await expect(page.getByText(/Offline — everything still works/)).toBeVisible();
  await context.setOffline(false);
});

test('renders legal pages and a 390px onboarding path accessibly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
  await page.goto('/terms');
  await expect(page.getByRole('heading', { name: 'Terms' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Make our board/ })).toBeVisible();
  const results = await new AxeBuilder({ page: page as never }).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('rejects a whitespace household name without persisting a broken board', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('What should we call this household?').fill('   ');
  await page.getByLabel('Who shares the rotation?').fill('Sam, Alex');
  await page.getByRole('button', { name: /Make our board/ }).click();
  await expect(page.getByRole('alert')).toHaveText(/Enter a household name/);
  await expect(page.getByLabel('What should we call this household?')).toBeFocused();
  const stored = await page.evaluate(async () => new Promise((resolve, reject) => {
    const open = indexedDB.open('fair-turn', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction('household', 'readonly').objectStore('household').get('current');
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    };
  }));
  expect(stored).toBeNull();
});

test('has keyboard focus, route metadata, and a designed not-found page', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://fair-turn.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.jpg$/);
  await page.goto('/not-a-real-route');
  await expect(page).toHaveTitle('Page not found — Fair Turn');
  await expect(page.getByRole('heading', { level: 1, name: 'This turn went missing.' })).toBeVisible();
  await expect(page.locator('h1')).toHaveCount(1);
});
