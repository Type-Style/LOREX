import { expect, test, Locator, Page } from '@playwright/test';
import { ageEntries, expectPopupEntry, openEntries, seedKnownEntries, uiLogin } from './helpers';

type Row = [label: string, value: string, detail?: string];

async function expectRows(list: Locator, rows: Row[]) {
	await expect(list.locator(':scope > dt')).toHaveText(rows.map(([label]) => label));
	await expect(list.locator(':scope > dd')).toHaveCount(rows.length);
	for (const [index, [, value, detail]] of rows.entries()) {
		const dd = list.locator(':scope > dd').nth(index);
		await expect(dd).toHaveText(detail ? `${value}${detail}` : value);
	}
	await expect.poll(() => list.evaluate(element => {
		const failures: string[] = [];
		const textRects = (node: Node) => {
			const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
			const rects: DOMRect[] = [];
			while (walker.nextNode()) {
				const text = walker.currentNode;
				if (!text.textContent?.trim()) { continue; }
				const range = document.createRange();
				range.selectNodeContents(text);
				const fragments = [...range.getClientRects()].filter(rect => rect.width && rect.height);
				if (fragments.some(rect => Math.abs(rect.top - fragments[0].top) > 2)) {
					failures.push(`wrapped text: ${text.textContent}`);
				}
				rects.push(...fragments);
			}
			return rects;
		};
		for (const node of element.childNodes) {
			if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
				failures.push(`stray text: ${node.textContent}`);
			}
		}
		for (const dt of element.querySelectorAll(':scope > dt')) {
			const dd = dt.nextElementSibling;
			if (dd?.tagName !== 'DD') { failures.push(`unpaired label: ${dt.textContent}`); continue; }
			const label = textRects(dt)[0];
			const values = textRects(dd);
			const primary = dd.classList.contains('actions')
				? Array.from(dd.querySelectorAll('button'), button => button.getBoundingClientRect())
				: values.filter(rect => !Array.from(dd.querySelectorAll('div')).some(detail => {
					const box = detail.getBoundingClientRect();
					return rect.top >= box.top && rect.bottom <= box.bottom;
				}));
			if (!label || !primary.length || primary.some(value => Math.min(label.bottom, value.bottom) - Math.max(label.top, value.top) < 2)) {
				failures.push(`label/value not on one line: ${dt.textContent}`);
			}
			const labelBox = dt.getBoundingClientRect();
			const valueBox = dd.getBoundingClientRect();
			if (labelBox.right > valueBox.left + 1) { failures.push(`overlapping columns: ${dt.textContent}`); }
			for (const rect of values) {
				if (rect.right > valueBox.right + 1 || rect.left < valueBox.left - 1) {
					failures.push(`value outside its row: ${dt.textContent}`);
				}
			}
		}
		return failures;
	}), { message: 'every displayed label, value and unit must share its row without wrapping or stray zeros' }).toEqual([]);
}

async function selectTab(page: Page, name: string, entry: Models.IEntry) {
	await page.getByRole('tab', { name, exact: true }).click();
	await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
	await expect(page).toHaveURL(url => url.searchParams.get('tab') === name && url.searchParams.get('popup') === String(entry.index));
	return page.locator('.leaflet-popup .popupList');
}

test('a non-info deep link and a selected tab survive browser reload', async ({ page, request }) => {
	await uiLogin(page);
	const entries = await seedKnownEntries(page, request, [{ speed: 7 }, {}]);
	const entry = entries[0];
	await ageEntries(page, entries);
	await openEntries(page, `/?popup=${entry.index}&tab=speed`);
	const popup = page.locator('.mapContainer .leaflet-popup');
	await expect(popup.getByRole('tab', { name: 'speed', exact: true })).toHaveAttribute('aria-selected', 'true');
	await expect(popup.locator('dt').filter({ hasText: /^GPS$/ }).locator('+ dd')).toHaveText(`${(entry.speed.gps * 3.6).toFixed(1)} km/h`);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(entry.index) && url.searchParams.get('tab') === 'speed');

	await selectTab(page, 'distance', entry);
	await page.reload();
	await expect(popup.getByRole('tab', { name: 'distance', exact: true })).toHaveAttribute('aria-selected', 'true');
	await expect(popup.locator('dt').filter({ hasText: /^Separation$/ }).locator('+ dd')).toHaveText(`${(entry.distance.total / 1000).toFixed(2)} km`);
	await expect(page).toHaveURL(url => url.searchParams.get('popup') === String(entry.index) && url.searchParams.get('tab') === 'distance');
	// This helper switches to info, so verify restored tab/content before checking identity.
	await expectPopupEntry(page, entry);
});

// TODO: cover keyboard tab navigation and focus restoration after closing a popup.
test('all popup tabs show exact real-entry values and aligned rows, including zero movement', async ({ page, request }) => {
	await uiLogin(page);
	const eta = Date.now() + 1800000;
	const entries = await seedKnownEntries(page, request, [
		{ altitude: 100 }, { altitude: 110, speed: 7, eta, eda: 12345 }, { lon: 8.012, altitude: 110, speed: 0, eta: 0, eda: 0 },
	]);
	expect(entries.every(entry => !entry.ignore)).toBe(true);
	expect(entries[1].distance.horizontal).toBeGreaterThan(0);
	expect(entries[2].distance).toMatchObject({ horizontal: 0, vertical: 0, total: 0 });
	expect(entries[2].speed).toMatchObject({ gps: 0, total: 0, vertical: 0 });
	await ageEntries(page, entries);

	for (const entry of entries.slice(1)) {
		const fullEntries = await openEntries(page, `/?popup=${entry.index}`);
		await expectPopupEntry(page, entry);
		const info: Row[] = [
			['Lat / Lon', `${entry.lat.toFixed(4)} / ${entry.lon.toFixed(4)}`, entry.address || undefined],
			['Height', `${entry.altitude.toFixed(1)} m`], ['Precision', `${entry.hdop} good`],
			['User', entry.user], ['index', String(entry.index)], ['ignore', 'ResetBeforeSelfAfter'],
		];
		await expectRows(await selectTab(page, 'info', entry), info);

		const speed: Row[] = [
			['GPS', `${(entry.speed.gps * 3.6).toFixed(1)} km/h`],
			['Calculated', `${(entry.speed.total! * 3.6).toFixed(1)} km/h`],
		];
		if (entry.speed.path !== undefined) { speed.push(['Path', `${(entry.speed.path * 3.6).toFixed(1)} km/h`]); }
		speed.push(['Vertical', `${(entry.speed.vertical! * 3.6).toFixed(1)} km/h`]);
		if (entry.speed.maxSpeed !== undefined) { speed.push(['MaxSpeed', `${entry.speed.maxSpeed.value.toFixed(1)} km/h`]); }
		await expectRows(await selectTab(page, 'speed', entry), speed);

		const preceding = fullEntries.filter(item => !item.ignore && item.index <= entry.index);
		const ongoing = preceding.reduce((sum, item) => sum + (item.distance?.horizontal ?? 0), 0) / 1000;
		const moving = preceding.filter(item => (item.time.diff ?? 0) < 600)
			.reduce((sum, item) => sum + (item.distance?.horizontal ?? 0), 0) / 1000;
		const distance: Row[] = [
			['Separation', `${(entry.distance.total / 1000).toFixed(2)} km`],
			['Horizontal', `${(entry.distance.horizontal / 1000).toFixed(2)} km`],
			['Vertical', `${(entry.distance.vertical / 1000).toFixed(1)} km`],
		];
		if (entry.distance.path !== undefined) { distance.push(['Path', `${(entry.distance.path / 1000).toFixed(2)} km`]); }
		distance.push(['Ongoing', `${ongoing.toFixed(2)} km`, `w/o Pause: ${moving.toFixed(2)} km`]);
		if (entry.eda) { distance.push(['EDA', `${(entry.eda / 1000).toFixed(3)} km`]); }
		await expectRows(await selectTab(page, 'distance', entry), distance);

		const created = new Date(entry.time.created).toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin', weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit',
			hour: '2-digit', hour12: false, minute: '2-digit', second: '2-digit',
		});
		const received = new Date(entry.time.recieved).toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
		});
		const time: Row[] = [
			['Created', created], ['Recieved', received], ['Upload', `${entry.time.uploadDuration.toFixed(1)}s`],
			['Diff', `${entry.time.diff!.toFixed(1)} s`],
		];
		if (entry.time.path !== undefined) { time.push(['Path Time', `${(entry.time.path / 1000).toFixed(1)}s`]); }
		if (entry.eta) { time.push(['ETA', new Date(entry.eta).toLocaleString('en-US', { timeZone: 'Europe/Berlin' })]); }
		await expectRows(await selectTab(page, 'time', entry), time);
	}
});

test('zero time difference does not emit a stray zero or invent calculated speed', async ({ page, request }) => {
	await uiLogin(page);
	const timestamp = Date.now() - 60000;
	const entries = await seedKnownEntries(page, request, [{ timestamp }, { timestamp, speed: 0 }]);
	const entry = entries[1];
	expect(entry.time.diff).toBe(0);
	expect(entry.speed.total).toBeUndefined();
	await ageEntries(page, entries);
	await openEntries(page, `/?popup=${entry.index}`);
	await expectPopupEntry(page, entry);
	const speed: Row[] = [['GPS', '0.0 km/h']];
	if (entry.speed.path !== undefined) { speed.push(['Path', `${(entry.speed.path * 3.6).toFixed(1)} km/h`]); }
	if (entry.speed.maxSpeed !== undefined) { speed.push(['MaxSpeed', `${entry.speed.maxSpeed.value.toFixed(1)} km/h`]); }
	await expectRows(await selectTab(page, 'speed', entry), speed);
	const list = await selectTab(page, 'time', entry);
	await expect(list.locator('dt').filter({ hasText: /^Diff$/ })).toHaveCount(0);
	await expect.poll(() => list.evaluate(element => [...element.childNodes]
		.filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()).map(node => node.textContent))).toEqual([]);
});
