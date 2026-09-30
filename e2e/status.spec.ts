import { expect, test } from '@playwright/test';
import { openEntries, seedKnownEntries, uiLogin } from './helpers';

test('the full status table shows calculated totals, pauses, ignored data and arrival estimates', async ({ page, request }) => {
	await uiLogin(page);
	const now = Date.now();
	// A same-time predecessor prevents older fixture timestamps inheriting a negative gap from shared data.
	const seeded = await seedKnownEntries(page, request, [
		{ timestamp: now - 1200000, altitude: 100 },
		{ timestamp: now - 1200000, altitude: 100, hdop: 30 },
		{ timestamp: now - 1140000, altitude: 120, speed: 2 },
		{ timestamp: now - 1080000, altitude: 110, speed: 8 },
		{ timestamp: now - 180000, altitude: 160, speed: 0, eta: now + 1800000, eda: 12345 },
	]);
	expect(seeded.slice(1).map(entry => entry.ignore)).toEqual([true, false, false, false]);
	const fixedNow = now + 120000;
	await page.clock.setFixedTime(fixedNow);
	const entries = await openEntries(page);
	expect(entries.at(-1)!.index).toBe(seeded.at(-1)!.index);
	const table = page.locator('.statusTable');
	await expect(table).toBeVisible();
	const row = (label: string) => table.locator(':scope > tbody > tr').filter({ has: page.locator('th').filter({ hasText: new RegExp(`^${label}$`) }) });
	const value = (label: string) => row(label).locator(':scope > td').last();
	const clean = entries.filter(entry => !entry.ignore);
	const moving = clean.filter(entry => (entry.time.diff ?? 0) < 600);
	const meanSpeed = (items: Models.IEntry[]) => {
		const speeds = items.flatMap(entry => entry.speed.horizontal === undefined ? [] : [entry.speed.horizontal]);
		return (speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length * 3.6).toFixed(1);
	};
	const distance = (items: Models.IEntry[]) => (items.reduce((sum, entry) => sum + (entry.distance?.horizontal ?? 0), 0) / 1000).toFixed(2);
	const upload = clean.reduce((sum, entry) => sum + (entry.time.recieved - entry.time.created) / 1000, 0) / clean.length;
	const up = clean.reduce((sum, entry) => sum + Math.max(entry.distance?.vertical ?? 0, 0), 0) / 1000;
	const down = clean.reduce((sum, entry) => sum + Math.min(entry.distance?.vertical ?? 0, 0), 0) / 1000;
	const gpsMean = clean.reduce((sum, entry) => sum + entry.speed.gps, 0) / clean.length * 3.6;
	const maxSpeed = Math.max(...clean.map(entry => entry.speed.gps)) * 3.6;
	const hasPause = meanSpeed(clean) !== meanSpeed(moving);

	await expect(table.locator(':scope > tbody > tr > th')).toHaveText([
		'data', ...(upload > 0 ? ['\u00d8 upload'] : []), '\u00d8 speed', 'maxSpeed', 'vertical', 'Distance', 'EDA', 'ETA',
	]);
	await expect(value('data')).toHaveText(`${clean.length}(${entries.length - clean.length})`);
	if (upload > 0) { await expect(value('\u00d8 upload')).toHaveText(`${upload.toFixed(3)}s`); }
	await expect(value('\u00d8 speed').locator(':scope > span').first()).toHaveText(`GPS: ${gpsMean.toFixed(1)}km/h`);
	for (const [label, unit, total, withoutPause] of [
		['\u00d8 speed', 'km/h', meanSpeed(clean), meanSpeed(moving)],
		['Distance', 'km', distance(clean), distance(moving)],
	]) {
		if (!hasPause) {
			await expect(value(label).locator(':scope > span').last()).toHaveText(label === 'Distance' ? `${total}km` : `Calc: ${total}km/h`);
			continue;
		}
		const subtable = value(label).locator('.subTable');
		await expect(subtable.locator('caption')).toHaveText(`Calculated (${unit})`);
		await expect(subtable.locator('th')).toHaveText(['Total', 'w/o Pause']);
		await expect(subtable.locator('td')).toHaveText([total, withoutPause]);
		for (const cell of await subtable.locator('td').all()) { await expect(cell).toBeVisible(); }
	}
	await expect(value('maxSpeed')).toHaveText(`${maxSpeed.toFixed(1)}km/h`);
	await expect(value('vertical')).toHaveText(`${up.toFixed(2)}km up, ${down.toFixed(2)}km down`);
	await expect(value('EDA')).toHaveText('12.35km');
	await expect(value('ETA')).toHaveText('28.0 minutes');
	for (const label of ['data', ...(upload > 0 ? ['\u00d8 upload'] : []), '\u00d8 speed', 'maxSpeed', 'vertical', 'Distance', 'EDA', 'ETA']) {
		await expect(value(label)).toBeVisible();
	}
});
