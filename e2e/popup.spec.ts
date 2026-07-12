import { expect, test } from '@playwright/test';
import { seedIfEmpty } from './helpers';

// Deep link: /?popup=<index> auto-opens that marker's popup once the map is
// ready. Seeds one entry when the day is still empty, so the spec also runs
// standalone against a clean server.
test('a popup deep link opens the marker popup with its tabs', async ({ page, request }) => {
	await page.goto('/login');
	await page.getByLabel('Username').fill('TEST');
	await page.getByLabel('Password').fill('test');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page.getByText('Logged In')).toBeVisible();

	// the latest entry always exists and is never ignored, so its marker is on the map
	const entries = await seedIfEmpty(page, request);
	const lastIndex = entries[entries.length - 1].index;

	await page.goto(`/?popup=${lastIndex}`);

	await expect(page.getByRole('tab', { name: 'info' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'speed' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'distance' })).toBeVisible();
	await expect(page.getByRole('tab', { name: 'time' })).toBeVisible();
});
