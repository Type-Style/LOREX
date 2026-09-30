import { expect, test } from '@playwright/test';
import { uiLogin } from './helpers';

// Shared server data is not guaranteed empty; stub only the entries read.
// Authentication and map/traffic token requests remain real.
test('a logged-in user without entries sees the no-data state instead of the map', async ({ page, isMobile }) => {
	await page.route(/\/read\?/, (route) => route.fulfill({ json: { entries: [] } }));
	const read = page.waitForResponse(response => new URL(response.url()).pathname === '/read');

	await uiLogin(page);
	const response = await read;
	expect(response.ok()).toBeTruthy();
	expect(await response.finished()).toBeNull();
	expect(await response.json()).toEqual({ entries: [] });
	await expect(page.locator('.subinfo').getByRole('progressbar')).toBeVisible();

	const message = page.getByText('No Data to be displayed');
	await expect(message).toBeAttached();
	if (!isMobile) { await expect(message).toBeVisible(); }
	await expect(page.locator('.mapContainer')).toHaveCount(0);
	await expect(page.locator('.customMarker')).toHaveCount(0);
});
