import { expect, test } from '@playwright/test';
import { readEntries, uiLogin, writeEntry } from './helpers';

// Frontend counterpart to the server-side ignore checks: 
// most recent entry is allways visible but next pull can ignore previous entries
// run after the Jest integration suite, like map.spec.ts.
test('a high-hdop entry loses its marker once the next entry arrives', async ({ page, request }) => {
	await uiLogin(page);

	// avoid hard cap first
	const entries = await readEntries(page, request);
	expect(entries.length, 'day file too close to the 1000-entry cap for /write to append - run npm run test:postClear').toBeLessThan(999);

	const mainMapMarkers = page.locator('.mapContainer .customMarker'); // all markers
	const runOffset = (Math.floor(Date.now() / 60000) % 100) * 0.005;
	const latA = 50 + runOffset;
	// distance between marker to avoid clustering
	const latB = latA + 0.0005;

	// entry A: bad accuracy (hdop 30), but as the latest entry it must be shown
	await writeEntry(request, { lat: latA, hdop: 30 }, 'A');
	await page.reload();
	await expect(mainMapMarkers.first()).toBeVisible();
	await page.waitForTimeout(2500); // let the fly-to animation and marker culling settle
	const markersCountWithA = await mainMapMarkers.count();

	// A to be ignored when B comes in
	await writeEntry(request, { lat: latB, hdop: 2 }, 'B');
	await page.reload();
	await expect(mainMapMarkers.first()).toBeVisible();
	await page.waitForTimeout(2500); // symmetric settle before the like-for-like count
	await expect(mainMapMarkers).toHaveCount(markersCountWithA); // count does not change since previous entry was replaced
	// todo, verify that entry b is actually entry b not a but B has not being written or something like that.

});
