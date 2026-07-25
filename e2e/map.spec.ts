import { expect, test } from '@playwright/test';
import { seedIfEmpty, uiLogin } from './helpers';

// Slightly advanced smoke: real login through the UI, then the Leaflet map
// appears with at least one marker. Seeds a single entry via /write only when
// today's data file is empty (decided via the server state, not the UI - the
// "No Data" span is briefly visible while the first fetch is in flight).
test('login shows the map with at least one marker', async ({ page, request }) => {
	await uiLogin(page);

	// domain invariant: the write path never ignores the incoming (latest) entry,
	// so any non-empty day has at least one non-ignored entry for the map to render
	await seedIfEmpty(page, request);

	// .mapContainer is the main map; the minimaps are separate .leaflet-container elements
	await expect(page.locator('.mapContainer')).toBeVisible();
	await expect(page.locator('.customMarker').first()).toBeVisible();
});
