import { expect, test, Page } from '@playwright/test';
import { ageEntries, closePopups, entryMarker, expectPopupEntry, openEntries, readEntries, seedKnownEntries, uiLogin } from './helpers';

async function ignoreAction(page: Page, entry: Models.IEntry, action: 'Self' | 'Before' | 'After' | 'Reset') {
	await entryMarker(page, entry).click();
	await expectPopupEntry(page, entry);
	const responsePromise = page.waitForResponse(response => {
		const url = new URL(response.url());
		return action === 'Reset' ? url.pathname === '/read' && url.search === '?index=0'
			: url.pathname === '/read/ignore' && url.searchParams.get('index') === String(entry.index)
				&& url.searchParams.get('direction') === (action === 'Self' ? null : action.toLowerCase());
	});
	// Mobile hides the text labels; select the real button by its label's DOM text.
	await page.locator('.leaflet-popup button').filter({ hasText: new RegExp(`^${action}$`) }).click();
	const response = await responsePromise;
	expect(response.ok()).toBeTruthy();
	expect(await response.finished()).toBeNull();
	const data = await response.json() as Models.IEntries;
	const visible = data.entries.filter(entry => !entry.ignore).length;
	await expect(page.locator('.statusTable > tbody > tr').first().locator('td').last())
		.toHaveText(`${visible}(${data.entries.length - visible})`);
	await closePopups(page);
	return data.entries;
}

async function expectView(page: Page, all: Models.IEntry[], fixtures: Models.IEntry[], expected: Models.IEntry[]) {
	await closePopups(page);
	const visible = all.filter(entry => !entry.ignore);
	await expect(page.locator('.statusTable > tbody > tr').first().locator('td').last())
		.toHaveText(`${visible.length}(${all.length - visible.length})`);
	expect(visible.filter(entry => fixtures.some(fixture => fixture.index === entry.index)).map(entry => entry.index))
		.toEqual(expected.map(entry => entry.index));
	for (const entry of fixtures) {
		if (expected.some(item => item.index === entry.index)) {
			await expect(entryMarker(page, entry)).toBeVisible();
			await entryMarker(page, entry).click();
			await expectPopupEntry(page, entry);
			await closePopups(page);
		} else {
			await expect(entryMarker(page, entry)).toHaveCount(0);
		}
	}
}

test('high-hdop A is removed when the verified entry B arrives', async ({ page, request }) => {
	await uiLogin(page);
	const [a] = await seedKnownEntries(page, request, [{ hdop: 30 }]);
	expect(a.ignore).toBe(false);
	await ageEntries(page, [a]);
	await expectView(page, await openEntries(page), [a], [a]);

	const [b] = await seedKnownEntries(page, request, [{ lat: a.lat, lon: a.lon + 0.012, timestamp: a.time.created + 60000 }]);
	expect(b.index).toBe(a.index + 1);
	expect(b.ignore).toBe(false);
	const persistedA = (await readEntries(page, request)).find(entry => entry.index === a.index);
	expect(persistedA).toMatchObject({ ignore: true, lat: a.lat, lon: a.lon, hdop: 30 });
	await ageEntries(page, [a, b]);
	await expectView(page, await openEntries(page), [a, b], [b]);
});

test('status toggle shows and hides the auto-ignored entry A on the map', async ({ page, request }) => {
	await uiLogin(page);
	const [a] = await seedKnownEntries(page, request, [{ hdop: 30 }]);
	const [b] = await seedKnownEntries(page, request, [{ lat: a.lat, lon: a.lon + 0.012, timestamp: a.time.created + 60000 }]);
	expect(b.index).toBe(a.index + 1);
	expect((await readEntries(page, request)).find(entry => entry.index === a.index)).toMatchObject({ ignore: true });
	await ageEntries(page, [a, b]);
	await openEntries(page);

	const ignoredA = page.locator(`.mapContainer .icon.ignored[data-entry-index="${a.index}"]`);
	const toggle = page.getByRole('button', { name: 'Show ignored entries on the map' });
	await expect(entryMarker(page, b)).toBeVisible();
	await expect(ignoredA).toHaveCount(0);
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-pressed', 'true');
	await expect(ignoredA).toBeVisible();

	await toggle.click();
	await expect(toggle).toHaveAttribute('aria-pressed', 'false');
	await expect(ignoredA).toHaveCount(0);
});

for (const action of ['Self', 'Before', 'After', 'Reset'] as const) {
	test(`UI Ignore ${action} keeps the correct subset of three real fixtures in the full dataset`, async ({ page, request }) => {
		await uiLogin(page);
		const entries = await seedKnownEntries(page, request, [{}, {}, {}]);
		expect(entries.every(entry => !entry.ignore)).toBe(true);
		await ageEntries(page, entries);
		const baseline = await openEntries(page);
		await expectView(page, baseline, entries, entries);
		const target = entries[1];
		const operation = action === 'Reset' ? 'Self' : action;
		const expected = entries.filter(entry => operation === 'Self' ? entry.index !== target.index
			: operation === 'Before' ? entry.index >= target.index : entry.index <= target.index);
		const result = await ignoreAction(page, target, operation);
		expect(result.map(entry => entry.index)).toEqual(baseline.map(entry => entry.index));
		for (const entry of result) {
			const removed = operation === 'Self' ? entry.index === target.index
				: operation === 'Before' ? entry.index < target.index : entry.index > target.index;
			expect(entry.ignore, `ignore flag for real entry ${entry.index}`).toBe(removed || baseline.find(item => item.index === entry.index)!.ignore);
		}
		expect(result.filter(entry => !entry.ignore && entries.some(fixture => fixture.index === entry.index))).toHaveLength(2);
		await expectView(page, result, entries, expected);
		if (action === 'Reset') {
			const reset = await ignoreAction(page, expected[0], 'Reset');
			expect(reset).toEqual(baseline);
			await expectView(page, reset, entries, entries);
		}
		const persisted = await readEntries(page, request);
		expect(persisted.filter(entry => entries.some(known => known.index === entry.index))).toEqual(entries);
	});
}
