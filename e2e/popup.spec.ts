import { expect, test } from '@playwright/test';
import { ageEntries, entryMarker, expectPopupEntry, openEntries, seedKnownEntries, uiLogin } from './helpers';

test('a deep link opens the requested older entry, not the latest fresh popup', async ({ page, request }) => {
	await uiLogin(page);
	const entries = await seedKnownEntries(page, request, [{}, {}]);
	const target = entries[0];
	await ageEntries(page, entries);
	await openEntries(page);
	for (const entry of entries) { await expect(entryMarker(page, entry)).toBeVisible(); }
	await expect(page.locator('.leaflet-popup')).toHaveCount(0);

	await openEntries(page, `/?popup=${target.index}`);
	await expectPopupEntry(page, target);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(target.index));
	for (const name of ['info', 'speed', 'distance', 'time']) {
		await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
	}
});

test('switching real markers keeps the newer popup URL after the older close delay', async ({ page, request }) => {
	await uiLogin(page);
	const entries = await seedKnownEntries(page, request, [{}, {}]);
	const [entryA, entryB] = entries;
	await ageEntries(page, entries);
	await openEntries(page);
	await expect(page.locator('.mapContainer .leaflet-popup')).toHaveCount(0);
	await entryMarker(page, entryA).click();
	await expectPopupEntry(page, entryA);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(entryA.index));
	// Outwait the former 150 ms open callback so it cannot mask A's stale close timer.
	await page.waitForTimeout(200);
	await entryMarker(page, entryB).click();
	await expectPopupEntry(page, entryB);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(entryB.index));
	// A retrying URL assertion can pass before A's 500 ms close timer fires.
	// Keep real timers running past that window to observe any stale deletion.
	await page.waitForTimeout(650);
	await expectPopupEntry(page, entryB);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(entryB.index));
	await page.locator('.mapContainer .leaflet-popup-close-button').click();
	await expect(page.locator('.mapContainer .leaflet-popup')).toHaveCount(0);
	await expect(page).toHaveURL(url => !url.searchParams.has('popup'));
});
