import { expect, test } from '@playwright/test';
import { uiLogin } from './helpers';

// The logged-in empty state: with no entries the Start page says so and renders
// no map. An actually-empty day cannot be guaranteed on the shared dev server
// (the other specs seed or write entries and runs repeat), so the entries fetch
// is stubbed at the network layer instead - the pattern for asserting no-data
// states without conflicting with the self-seeding specs (helpers.ts seedIfEmpty).
// Order-independent: never writes, ignores the real server data.
test('a logged-in user without entries sees the no-data state instead of the map', async ({ page }) => {
	// stub only the entries fetch (/read?...) - /read/maptoken and /read/traffictoken stay real
	await page.route(/\/read\?/, (route) => route.fulfill({ json: { entries: [] } }));

	await uiLogin(page);

	// the stubbed empty read leaves the logged-in page bare: message instead of map
	await expect(page.getByText('No Data to be displayed')).toBeVisible();
	await expect(page.locator('.mapContainer')).toHaveCount(0);
	await expect(page.locator('.customMarker')).toHaveCount(0);
});
