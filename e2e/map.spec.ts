import { expect, test } from '@playwright/test';
import { ageEntries, openEntries, seedIfEmpty, uiLogin } from './helpers';

test('login shows the map with at least one marker', async ({ page, request }) => {
	await uiLogin(page);

	// avoid empty data state
	const entries = await seedIfEmpty(page, request);
	await ageEntries(page, entries);
	const entry = (await openEntries(page)).at(-1)!;

	await expect(page.locator('.mapContainer')).toBeVisible();
	await expect(page.locator('.customMarker').first()).toBeVisible();
	const link = page.locator('.subinfo a.info');
	await expect(link).toHaveText(`${entry.lat} / ${entry.lon}`);
	const url = new URL((await link.getAttribute('href'))!);
	expect(url.protocol).toBe('https:');
	expect(url.hostname).toBe('www.openstreetmap.org');
	expect(Number(url.searchParams.get('mlat'))).toBe(entry.lat);
	expect(Number(url.searchParams.get('mlon'))).toBe(entry.lon);
	expect(url.searchParams.get('marker')).toBe(`${entry.lat}/${entry.lon}`);
	expect(url.hash).toBe(`#map=13/${entry.lat}/${entry.lon}`);
});
