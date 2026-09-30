import { expect, test } from '@playwright/test';
import { closePopups, entryMarker, expectPopupEntry, openEntries, readEntries, seedKnownEntries, uiLogin } from './helpers';

test('live polling replaces the previous last entry and does not duplicate unchanged data', async ({ page, request }) => {
	test.setTimeout(180000);
	await uiLogin(page);
	const existing = await readEntries(page, request);
	expect(existing.length + 2, 'both polling fixtures must fit below the daily append cap').toBeLessThanOrEqual(1000);
	// A is initially visible; writing B makes the server revise A's ignore flag.
	const [a] = await seedKnownEntries(page, request, [{ user: 'PA', hdop: 30 }]);
	expect(a.ignore).toBe(false);
	const baseline = await openEntries(page);
	expect(baseline).toHaveLength(existing.length + 1);
	expect(baseline.at(-1)).toEqual(a);
	const documentStarted = await page.evaluate(() => performance.timeOrigin);
	const dataCount = page.locator('.statusTable > tbody > tr').first().locator('td').last();
	const gps = page.locator('.subinfo a.info');
	const progress = page.locator('.subinfo').getByRole('progressbar');
	const expectView = async (entries: Models.IEntry[], latest: Models.IEntry) => {
		const cleanCount = entries.filter(entry => !entry.ignore).length;
		// Status is deliberately hidden behind an open popup on mobile.
		await expect(dataCount).toHaveText(`${cleanCount}(${entries.length - cleanCount})`);
		await expect(gps).toBeVisible();
		await expect(gps).toHaveText(`${latest.lat} / ${latest.lon}`);
		const link = new URL((await gps.getAttribute('href'))!);
		expect(link.searchParams.get('mlat')).toBe(String(latest.lat));
		expect(link.searchParams.get('mlon')).toBe(String(latest.lon));
		await expect(entryMarker(page, latest)).toHaveCount(1);
		await expect(entryMarker(page, latest)).toBeVisible();
		await expect(entryMarker(page, latest).locator('.icon')).toHaveClass(/\bend\b/);
		if (!await page.locator('.mapContainer .leaflet-popup').isVisible()) {
			await entryMarker(page, latest).click();
		}
		await expectPopupEntry(page, latest);
		await closePopups(page);
	};
	await expectView(baseline, a);

	// From here on, keep the same document and real timers: no navigation or manual fetch.
	const waitForPoll = () => page.waitForResponse(response => new URL(response.url()).pathname === '/read', { timeout: 75000 });
	let pending = waitForPoll();
	const [b] = await seedKnownEntries(page, request, [{
		user: 'PB', lat: a.lat, lon: a.lon + 0.012, timestamp: a.time.created + 60000,
	}]);
	expect(b.index).toBe(a.index + 1);
	expect(b.ignore).toBe(false);
	expect(b.heading).not.toBe(a.heading);
	const updated = await readEntries(page, request);
	expect(updated).toHaveLength(baseline.length + 1);
	expect(updated.map(entry => entry.index)).toEqual([...baseline.map(entry => entry.index), b.index]);
	expect(updated.slice(0, -2)).toEqual(baseline.slice(0, -1));
	expect(updated.at(-2)).toEqual({ ...a, ignore: true });
	expect(updated.at(-1)).toEqual(b);

	for (const index of [a.index, b.index]) {
		if (index === b.index) {
			// Observe the old countdown before waiting for its reset, so unchanged UI
			// assertions cannot pass before React has applied the second response.
			await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow')), { timeout: 45000 }).toBeGreaterThan(50);
		}
		const response = await pending;
		expect(response.request().method()).toBe('GET');
		expect(new URL(response.request().url()).searchParams.get('index')).toBe(String(index));
		expect(response.ok()).toBeTruthy();
		expect(await response.finished()).toBeNull();
		const { entries } = await response.json() as Models.IEntries;
		expect(entries).toEqual(index === a.index ? updated.slice(-2) : [b]);
		await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(10);
		await expectView(updated, b);
		await expect(entryMarker(page, a)).toHaveCount(0);
		expect(await readEntries(page, request)).toEqual(updated);
		expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted);
		if (index === a.index) { pending = waitForPoll(); }
	}
});
