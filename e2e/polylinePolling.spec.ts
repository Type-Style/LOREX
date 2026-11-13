import { expect, Page, test } from '@playwright/test';
import { closePopups, entryMarker, expectPopupEntry, openEntries, readEntries, seedKnownEntries, uiLogin } from './helpers';

// Two real polling intervals, with room for a poll during a fixture write.
test.describe.configure({ timeout: 330000 });

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
			const points = [0.2, 0.4, 0.6, 0.8].map(fraction => {
				const point = path.getPointAtLength(path.getTotalLength() * fraction).matrixTransform(matrix);
				return { x: point.x, y: point.y };
			});
			const child = Array.from(path.parentElement!.children).indexOf(path) + 1;
			return [{ rgb: Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3), points, child }];
		});
	}, { fromIndex: from.index, toIndex: to.index });
}

async function expectSegmentColor(page: Page, from: Models.IEntry, to: Models.IEntry, rgb: number[]) {
	await expect.poll(async () => (await segments(page, from, to)).map(segment => segment.rgb), {
		message: `segment ${from.index} → ${to.index} should have the expected rendered color`,
	}).toEqual([rgb]);
	// Compare actual pixels with a screenshot-only hidden-line control: white tiles
	// alone must not count as a visible white segment.
	await expect.poll(async () => {
		const matches = await segments(page, from, to);
		if (matches.length !== 1) { return false; }
		const screenshot = await page.screenshot({ scale: 'css' });
		const hiddenOptions = {
			scale: 'css',
			style: `.mapContainer .leaflet-overlay-pane path.customPolyline:nth-child(${matches[0].child}) { visibility: hidden !important; }`,
		} as const;
		const withoutLine = await page.screenshot(hiddenOptions);
		const withoutLineAgain = await page.screenshot(hiddenOptions);
		const screenshotAgain = await page.screenshot({ scale: 'css' });
		const after = await segments(page, from, to);
		if (after.length !== 1 || after[0].child !== matches[0].child || after[0].points.some((point, index) =>
			Math.hypot(point.x - matches[0].points[index].x, point.y - matches[0].points[index].y) > 1)) { return false; }
		return page.evaluate(async ({ image, imageAgain, hidden, hiddenAgain, points, expected }) => {
			const load = async (data: string) => {
				const bitmap = new Image();
				bitmap.src = `data:image/png;base64,${data}`;
				await bitmap.decode();
				return bitmap;
			};
			const bitmaps = await Promise.all([image, imageAgain, hidden, hiddenAgain].map(load));
			const canvas = document.createElement('canvas');
			canvas.width = bitmaps[0].width;
			canvas.height = bitmaps[0].height;
			const context = canvas.getContext('2d')!;
			const [visible, visibleAgain, obscured, obscuredAgain] = bitmaps.map(bitmap => {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(bitmap, 0, 0);
				return context.getImageData(0, 0, canvas.width, canvas.height).data;
			});
			return points.filter(({ x, y }) => {
				const left = Math.round(x) - 2;
				const top = Math.round(y) - 2;
				if (left < 0 || top < 0 || left + 5 > canvas.width || top + 5 > canvas.height) { return false; }
				for (let row = top; row < top + 5; row++) {
					for (let col = left; col < left + 5; col++) {
						const i = (row * canvas.width + col) * 4;
						if (expected.every((value, channel) => Math.abs(visible[i + channel] - value) <= 6
							&& Math.abs(visible[i + channel] - visibleAgain[i + channel]) <= 2
							&& Math.abs(obscured[i + channel] - obscuredAgain[i + channel]) <= 2)
							&& expected.some((_, channel) => Math.abs(visible[i + channel] - obscured[i + channel]) >= 12)) { return true; }
					}
				}
				return false;
			}).length >= 2;
		}, {
			image: screenshot.toString('base64'), imageAgain: screenshotAgain.toString('base64'),
			hidden: withoutLine.toString('base64'), hiddenAgain: withoutLineAgain.toString('base64'),
			points: matches[0].points, expected: rgb,
		});
	}, { message: `segment ${from.index} → ${to.index} should be visible in the expected color` }).toBe(true);
}

test('polling recolors older segments when a new entry raises the maximum speed', async ({ page, request }) => {
	await uiLogin(page);
	const existing = await readEntries(page, request);
	expect(existing.length + 4, 'all four fixtures must fit below the daily append cap').toBeLessThanOrEqual(1000);
	// Avoid older markers covering A before the view is isolated via its popup.
	const lat = Array.from({ length: 1001 }, (_, index) => Number((50 + index * 0.03).toFixed(4)))
		.find(candidate => existing.every(entry => Math.abs(entry.lat - candidate) > 0.003 || Math.abs(entry.lon - 8) > 0.003))!;
	expect(lat, 'a location away from existing markers must be available').toBeDefined();
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
	// Use a real dark map layer so the fastest white line contrasts with the map.
	const layers = map.locator('.leaflet-control-layers');
	const darkLayer = layers.getByLabel('Stadia AlidadeSmoothDark', { exact: true });
	if (!await darkLayer.isVisible()) { await layers.locator('.leaflet-control-layers-toggle').press('Enter'); }
	await darkLayer.press('Space');
	await expect(darkLayer).toBeChecked();
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
	await expect(entryMarker(page, b).locator('.icon')).toHaveClass(/\bend\b/);
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
	await expect(entryMarker(page, b).locator('.icon')).toHaveClass(/\bnone\b/);
	await expect(entryMarker(page, c).locator('.icon')).toHaveClass(/\bend\b/);
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
	await expect(entryMarker(page, c).locator('.icon')).toHaveClass(/\bnone\b/);
	await expect(entryMarker(page, d).locator('.icon')).toHaveClass(/\bend\b/);
	await expectSegmentColor(page, a, b, [231, 0, 117]);
	await expectSegmentColor(page, b, c, [238, 0, 62]);
	await expectSegmentColor(page, c, d, [255, 255, 255]);
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted);
});
