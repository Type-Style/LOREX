import { expect, test } from '@playwright/test';
import { seedIfEmpty, uiLogin } from './helpers';

test('login shows the map with at least one marker', async ({ page, request }) => {
	await uiLogin(page);

	// avoid empty data state
	await seedIfEmpty(page, request);

	await expect(page.locator('.mapContainer')).toBeVisible();
	await expect(page.locator('.customMarker').first()).toBeVisible();
});