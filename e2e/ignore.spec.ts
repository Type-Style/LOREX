import { expect, test } from '@playwright/test';
import { readEntries, uiLogin, writeEntry } from './helpers';

// Frontend counterpart to the server-side ignore checks: a freshly written entry
// is always visible (the latest entry is never ignored), but once the NEXT entry
// arrives, the server re-evaluates the previous one - with a high hdop it becomes
// ignored and its marker disappears from the map.
//
// Repeat-safe: each run writes ~550m away from the previous one (time-based
// offset), so leftover markers from earlier runs neither cluster with the new
// ones nor break the count. The assertion is a net-zero delta: entry B replaces
// entry A on the map instead of joining it. Appends to today's data file:
// run after the Jest integration suite, like map.spec.ts.
test('a high-hdop entry loses its marker once the next entry arrives', async ({ page, request }) => {
	await uiLogin(page);

	// this test appends two entries, but at the 1000-entry cap /write stops appending
	// (src/controller/write.ts): A would be dropped and B would replace the last
	// entry. The Jest integration suite fills the day file to exactly that cap, so
	// failing here means the convention was skipped: npm run test:postClear before e2e.
	const entries = await readEntries(page, request);
	expect(entries.length, 'day file too close to the 1000-entry cap for /write to append - run npm run test:postClear').toBeLessThan(999);

	const mainMapMarkers = page.locator('.mapContainer .customMarker');
	const runOffset = (Math.floor(Date.now() / 60000) % 100) * 0.005;
	const latA = 50 + runOffset;
	// B sits ~55m from A: same viewport for both counts (like-for-like), outside
	// the ~22m ignore-close radius, and A's hidden marker cannot cluster with it
	const latB = latA + 0.0005;

	// entry A: bad accuracy (hdop 30), but as the latest entry it must be shown
	await writeEntry(request, { lat: latA, hdop: 30 }, 'A');
	await page.reload();
	await expect(mainMapMarkers.first()).toBeVisible();
	await page.waitForTimeout(2500); // let the fly-to animation and marker culling settle
	const markersWithA = await mainMapMarkers.count();

	// entry B: good accuracy - the server now marks A as ignored, so B replaces
	// A on the map instead of joining it (net marker count stays constant)
	await writeEntry(request, { lat: latB, hdop: 2 }, 'B');
	await page.reload();
	await expect(mainMapMarkers.first()).toBeVisible();
	await page.waitForTimeout(2500); // symmetric settle before the like-for-like count
	await expect(mainMapMarkers).toHaveCount(markersWithA);
});
