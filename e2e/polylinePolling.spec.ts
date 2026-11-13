import { expect, Page, test } from '@playwright/test';
import { closePopups, entryMarker, expectPopupEntry, openEntries, readEntries, seedKnownEntries, uiLogin } from './helpers';

// Identify a straight segment by its indexed markers, not by SVG order or a React key.
async function segments(page: Page, from: Models.IEntry, to: Models.IEntry) {
	return page.evaluate(({ fromIndex, toIndex }) => {
		const map = document.querySelector('.mapContainer');
		const center = (index: number) => {
			const marker = map?.querySelector(`[data-entry-index="${index}"]`)?.closest('.customMarker');
			if (!marker) { return null; }
			const box = marker.getBoundingClientRect();
			return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
		};
		const start = center(fromIndex);
		const end = center(toIndex);
		if (!start || !end || !map) { return []; }

		return Array.from(map.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane path.customPolyline')).flatMap(path => {
			const matrix = path.getScreenCTM();
			if (!matrix || !path.getTotalLength()) { return []; }
			const style = getComputedStyle(path);
			if (style.visibility !== 'visible' || Number(style.opacity) < 0.99 || Number(style.strokeOpacity) < 0.99) { return []; }
			const first = path.getPointAtLength(0).matrixTransform(matrix);
			const last = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
			const near = (a: DOMPoint, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 6;
			if (!near(first, start) || !near(last, end)) { return []; }

			// Canvas converts the browser's computed SVG color to comparable RGB pixels.
			const context = document.createElement('canvas').getContext('2d')!;
			context.fillStyle = style.stroke;
			context.fillRect(0, 0, 1, 1);
			const points = [0.3, 0.4, 0.5, 0.6, 0.7].map(fraction => {
				const point = path.getPointAtLength(path.getTotalLength() * fraction).matrixTransform(matrix);
				return { x: point.x, y: point.y };
			});
			return [{ rgb: Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3), points }];
		});
	}, { fromIndex: from.index, toIndex: to.index });
}

async function expectSegmentColor(page: Page, from: Models.IEntry, to: Models.IEntry, rgb: number[]) {
	await expect.poll(async () => (await segments(page, from, to)).map(segment => segment.rgb), {
		message: `segment ${from.index} → ${to.index} should have the expected rendered color`,
	}).toEqual([rgb]);
	// Also check painted pixels: a hidden or covered SVG stroke is not a visible line.
	await expect.poll(async () => {
		const matches = await segments(page, from, to);
		if (matches.length !== 1) { return false; }
		const screenshot = await page.screenshot({ scale: 'css' });
		return page.evaluate(async ({ image, points, expected }) => {
			const bitmap = new Image();
			bitmap.src = `data:image/png;base64,${image}`;
			await bitmap.decode();
			const canvas = document.createElement('canvas');
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
			const context = canvas.getContext('2d')!;
			context.drawImage(bitmap, 0, 0);
			return points.filter(({ x, y }) => {
				const left = Math.round(x) - 2;
				const top = Math.round(y) - 2;
				if (left < 0 || top < 0 || left + 5 > canvas.width || top + 5 > canvas.height) { return false; }
				const pixels = context.getImageData(left, top, 5, 5).data;
				for (let i = 0; i < pixels.length; i += 4) {
					if (expected.every((value, channel) => Math.abs(pixels[i + channel] - value) <= 6)) { return true; }
				}
				return false;
			}).length >= 2;
		}, { image: screenshot.toString('base64'), points: matches[0].points, expected: rgb });
	}, { message: `segment ${from.index} → ${to.index} should be visible in the expected color` }).toBe(true);
}

test('polling recolors older segments when a new entry raises the maximum speed', async ({ page, request }) => {
	test.setTimeout(330000);
	await uiLogin(page);
	const existing = await readEntries(page, request);
	expect(existing.length + 4, 'all four fixtures must fit below the daily append cap').toBeLessThanOrEqual(1000);
	const lat = 50 + existing.length * 0.002;
	const start = await page.evaluate(() => {
		const now = Date.now();
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);
		return Math.max(now - 180000, today.getTime() + 1000);
	});
	const [a, b] = await seedKnownEntries(page, request, [
		{ user: 'LA', lat, lon: 8, speed: 0.5, timestamp: start },
		{ user: 'LB', lat: lat + 0.0004, lon: 8.0009, speed: 1, timestamp: start + 30000 },
	]);
	expect(b.index).toBe(a.index + 1);
	expect([a.ignore, b.ignore]).toEqual([false, false]);
	expect([a.speed.gps, b.speed.gps]).toEqual([0.5, 1]);
	expect(b.time.diff).toBe(30);
	expect(b.distance.horizontal).toBeGreaterThan(22);
	expect(b.distance.horizontal).toBeLessThan(100);
	expect(b.speed.horizontal!).toBeLessThan(b.speed.gps * 3.6);
	expect(b.path?.coordinates).toBeUndefined(); // this fixture uses a straight segment
	const baseline = await openEntries(page);
	expect(baseline.slice(-2)).toEqual([a, b]);
	const documentStarted = await page.evaluate(() => performance.timeOrigin);

	// Uncluster the nearby fixtures before using A's real popup. The ignore action
	// affects this browser's view only; it does not change the stored old entries.
	const map = page.locator('.mapContainer');
	await expect(entryMarker(page, b)).toBeVisible();
	await closePopups(page);
	for (let zoom = 14; zoom <= 16; zoom++) {
		await map.getByRole('button', { name: 'Zoom in', exact: true }).press('Enter');
		await expect(map.locator(`.leaflet-tile-container[style*="z-index: 19"] img.leaflet-tile[src*="/${zoom}/"]`).first()).toBeAttached();
		await expect(map.locator('.leaflet-map-pane')).not.toHaveClass(/leaflet-zoom-anim/);
	}
	await closePopups(page);
	if (a.index > 0) {
		await entryMarker(page, a).click();
		await expectPopupEntry(page, a);
		const pendingIgnore = page.waitForResponse(response => {
			const url = new URL(response.url());
			return url.pathname === '/read/ignore' && url.searchParams.get('index') === String(a.index)
				&& url.searchParams.get('direction') === 'before';
		});
		await map.locator('.leaflet-popup button').filter({ hasText: /^Before$/ }).click();
		const response = await pendingIgnore;
		expect(response.ok()).toBeTruthy();
		const { entries } = await response.json() as Models.IEntries;
		expect(entries.filter(entry => !entry.ignore).map(entry => entry.index)).toEqual([a.index, b.index]);
		await closePopups(page);
		await expect(page.locator('.statusTable > tbody > tr').first().locator('td').last())
			.toHaveText(`2(${entries.length - 2})`);
	}
	await expectSegmentColor(page, a, b, [255, 255, 255]);

	// A response may arrive while a write is in flight. Wait for the poll that
	// actually contains the new entry rather than accepting an earlier empty poll.
	const waitForPoll = (index: number, user: string, timestamp: number) => page.waitForResponse(async response => {
		const url = new URL(response.url());
		if (url.pathname !== '/read' || url.searchParams.get('index') !== String(index) || !response.ok()) { return false; }
		const { entries } = await response.json() as Models.IEntries;
		return entries.some(entry => entry.user === user && entry.time.created === timestamp);
	}, { timeout: 125000 });

	let pending = waitForPoll(b.index, 'LC', start + 60000);
	const [c] = await seedKnownEntries(page, request, [{
		user: 'LC', lat: lat + 0.0008, lon: 8.0018, speed: 10, timestamp: start + 60000,
	}]);
	expect(c.index).toBe(b.index + 1);
	expect(c.ignore).toBe(false);
	expect(c.speed.gps).toBe(10);
	expect(c.time.diff).toBe(30);
	expect(c.distance.horizontal).toBeGreaterThan(22);
	expect(c.distance.horizontal).toBeLessThan(100);
	expect(c.path?.coordinates).toBeUndefined();
	let persisted = await readEntries(page, request);
	expect(persisted.slice(-3)).toEqual([a, b, c]);
	let response = await pending;
	expect(response.request().method()).toBe('GET');
	expect(await response.json()).toEqual({ entries: [b, c] });
	await expectSegmentColor(page, a, b, [238, 0, 62]);
	await expectSegmentColor(page, b, c, [255, 255, 255]);

	pending = waitForPoll(c.index, 'LD', start + 90000);
	const [d] = await seedKnownEntries(page, request, [{
		user: 'LD', lat: lat + 0.0012, lon: 8.0027, speed: 100, timestamp: start + 90000,
	}]);
	expect(d.index).toBe(c.index + 1);
	expect(d.ignore).toBe(false);
	expect(d.speed.gps).toBe(100);
	expect(d.time.diff).toBe(30);
	expect(d.distance.horizontal).toBeGreaterThan(22);
	expect(d.distance.horizontal).toBeLessThan(100);
	expect(d.path?.coordinates).toBeUndefined();
	persisted = await readEntries(page, request);
	expect(persisted.slice(-4)).toEqual([a, b, c, d]);
	response = await pending;
	expect(response.request().method()).toBe('GET');
	// Neither endpoint of A → B was refetched, but its color must change again.
	expect(await response.json()).toEqual({ entries: [c, d] });
	await expectSegmentColor(page, a, b, [231, 0, 117]);
	await expectSegmentColor(page, b, c, [238, 0, 62]);
	await expectSegmentColor(page, c, d, [255, 255, 255]);
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted);
});
