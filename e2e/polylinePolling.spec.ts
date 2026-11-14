import { expect, Page, test } from '@playwright/test';
import { clearEntries, closePopups, entryMarker, expectPopupEntry, openEntries, readEntries, seedKnownEntries, uiLogin } from './helpers';

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
			const length = path.getTotalLength();
			if (!matrix || !length) { return []; }
			const style = getComputedStyle(path);
			if (style.visibility !== 'visible' || Number(style.opacity) < 0.99 || Number(style.strokeOpacity) < 0.99) { return []; }
			const pointAt = (fraction: number) => path.getPointAtLength(length * fraction).matrixTransform(matrix);
			const near = (a: DOMPoint, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 6;
			if (!near(pointAt(0), start) || !near(pointAt(1), end)) { return []; }

			// Canvas converts the browser's computed SVG color to comparable RGB pixels.
			const context = document.createElement('canvas').getContext('2d')!;
			context.fillStyle = style.stroke;
			context.fillRect(0, 0, 1, 1);
			const points = [0.38, 0.5, 0.62].map(fraction => {
				const { x, y } = pointAt(fraction);
				return { x, y };
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

	// Compare actual pixels with a hidden-line control so light map features cannot mask a missing segment.
	await expect.poll(async () => {
		const matches = await segments(page, from, to);
		if (matches.length !== 1) { return false; }
		const [before] = matches;
		const visiblePng = await page.screenshot({ scale: 'css' });
		const hiddenPng = await page.screenshot({
			scale: 'css',
			style: `.mapContainer .leaflet-overlay-pane path.customPolyline:nth-child(${before.child}) { visibility: hidden !important; }`,
		});
		const after = await segments(page, from, to);
		if (after.length !== 1 || after[0].child !== before.child || after[0].points.some((point, index) =>
			Math.hypot(point.x - before.points[index].x, point.y - before.points[index].y) > 1)) { return false; }

		return page.evaluate(async ({ image, hidden, points, expected }) => {
			const decode = async (base64: string) => {
				const bitmap = new Image();
				bitmap.src = `data:image/png;base64,${base64}`;
				await bitmap.decode();
				return bitmap;
			};
			const [visibleBitmap, hiddenBitmap] = await Promise.all([decode(image), decode(hidden)]);
			const canvas = document.createElement('canvas');
			canvas.width = visibleBitmap.width;
			canvas.height = visibleBitmap.height;
			const context = canvas.getContext('2d')!;
			const pixels = (bitmap: HTMLImageElement) => {
				context.clearRect(0, 0, canvas.width, canvas.height);
				context.drawImage(bitmap, 0, 0);
				return context.getImageData(0, 0, canvas.width, canvas.height).data;
			};
			const visible = pixels(visibleBitmap);
			const obscured = pixels(hiddenBitmap);
			return points.filter(({ x, y }) => {
				const left = Math.round(x) - 2;
				const top = Math.round(y) - 2;
				if (left < 0 || top < 0 || left + 5 > canvas.width || top + 5 > canvas.height) { return false; }
				for (let row = top; row < top + 5; row++) {
					for (let col = left; col < left + 5; col++) {
						const i = (row * canvas.width + col) * 4;
						if (expected.every((value, channel) => Math.abs(visible[i + channel] - value) <= 6)
							&& expected.some((_, channel) => Math.abs(visible[i + channel] - obscured[i + channel]) >= 12)) { return true; }
					}
				}
				return false;
			}).length >= 2;
		}, {
			image: visiblePng.toString('base64'),
			hidden: hiddenPng.toString('base64'),
			points: before.points,
			expected: rgb,
		});
	}, { message: `segment ${from.index} → ${to.index} should be visible in the expected color` }).toBe(true);
}

// Polling changes the last-entry key and remounts the polylines, so it cannot prove an in-place color update.
test('ignoring an earlier maximum-speed entry recolors a surviving mounted segment', async ({ page, request }) => {
	clearEntries();
	await uiLogin(page);
	const start = await page.evaluate(() => {
		const now = Date.now();
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);
		return Math.max(now - 180000, today.getTime() + 1000);
	});
	// Ignoring fastest C lowers the maximum from 20 to 2 while D remains the last entry.
	const [a, b, c, d] = await seedKnownEntries(page, request, [
		{ user: 'LA', lat: 50, lon: 8, speed: 1, timestamp: start },
		{ user: 'LB', lat: 50.0009, lon: 8.0011, speed: 2, timestamp: start + 40000 },
		{ user: 'LC', lat: 50.0018, lon: 8.0022, speed: 20, timestamp: start + 80000 },
		{ user: 'LD', lat: 50.0009, lon: 8.0022, speed: 1, timestamp: start + 120000 },
	]);
	expect([a.index, b.index, c.index, d.index]).toEqual([0, 1, 2, 3]);
	expect([a.ignore, b.ignore, c.ignore, d.ignore]).toEqual([false, false, false, false]);
	expect([a.speed.gps, b.speed.gps, c.speed.gps, d.speed.gps]).toEqual([1, 2, 20, 1]);
	expect(b.time.diff).toBe(40);
	expect(b.distance.horizontal).toBeGreaterThan(22);
	expect(b.speed.horizontal!).toBeLessThan(b.speed.gps * 3.6);
	expect(b.path?.coordinates).toBeUndefined();

	// Keep the latest marker fresh without advancing the browser into the next day.
	await page.clock.setFixedTime(d.time.recieved);
	expect(await openEntries(page)).toEqual([a, b, c, d]);
	const map = page.locator('.mapContainer');
	await expect(entryMarker(page, d).locator('.icon')).toHaveClass(/\bend\b/);
	await expect(map.locator('.leaflet-popup')).toBeVisible();
	await closePopups(page);

	// Make the white post-ignore line visible and expose the individual markers on mobile.
	const layers = map.locator('.leaflet-control-layers');
	const darkLayer = layers.getByLabel('Stadia AlidadeSmoothDark', { exact: true });
	await expect(async () => {
		if (!await darkLayer.isVisible()) { await layers.locator('.leaflet-control-layers-toggle').press('Enter'); }
		await darkLayer.press('Space');
		await expect(darkLayer).toBeChecked({ timeout: 1000 });
	}).toPass({ timeout: 5000 });
	for (let zoom = 14; zoom <= 16; zoom++) {
		await map.getByRole('button', { name: 'Zoom in', exact: true }).press('Enter');
		await expect(map.locator(`.leaflet-tile-container[style*="z-index: 19"] img.leaflet-tile[src*="/${zoom}/"]`).first()).toBeAttached();
		await expect(map.locator('.leaflet-map-pane')).not.toHaveClass(/leaflet-zoom-anim/);
	}

	await expectSegmentColor(page, a, b, [238, 0, 62]);
	const [before] = await segments(page, a, b);
	const originalPath = await map.locator(`.leaflet-overlay-pane path.customPolyline:nth-child(${before.child})`).elementHandle();
	if (!originalPath) { throw new Error('Expected the A → B SVG path'); }

	await entryMarker(page, c).click();
	await expectPopupEntry(page, c);
	const pending = page.waitForResponse(response => {
		const url = new URL(response.url());
		return url.pathname === '/read/ignore' && url.searchParams.get('index') === String(c.index)
			&& !url.searchParams.has('direction');
	});
	await map.locator('.leaflet-popup button').filter({ hasText: /^Self$/ }).click();
	const response = await pending;
	expect(response.ok()).toBeTruthy();
	const { entries } = await response.json() as Models.IEntries;
	expect(entries.map(entry => entry.index)).toEqual([a.index, b.index, c.index, d.index]);
	expect(entries.map(entry => entry.ignore)).toEqual([false, false, true, false]);
	await expect(entryMarker(page, c)).toHaveCount(0);
	await expect(entryMarker(page, d).locator('.icon')).toHaveClass(/\bend\b/);
	await expectPopupEntry(page, d);
	await closePopups(page);

	// D keeps the parent key stable; the same SVG node proves A → B was recolored, not replaced.
	await expect.poll(async () => (await segments(page, a, b)).length).toBe(1);
	const [after] = await segments(page, a, b);
	expect(await originalPath.evaluate((path, child) =>
		path.isConnected && path.parentElement?.children[child - 1] === path, after.child)).toBe(true);
	await expectSegmentColor(page, a, b, [255, 255, 255]);
	await originalPath.dispose();

	// Recency expires without a new entry or an unrelated render.
	const animatedLine = map.locator('.leaflet-overlay-pane path.customPolyline.animate');
	await expect(animatedLine).toHaveCount(1);
	await page.clock.setFixedTime(d.time.recieved + 61000);
	await expect(animatedLine).toHaveCount(0);
});

test('polling recolors older segments when a new entry raises the maximum speed', { tag: '@polling' }, async ({ page, request }) => {
	clearEntries();
	await uiLogin(page);
	const start = await page.evaluate(() => {
		const now = Date.now();
		const today = new Date(now);
		today.setHours(0, 0, 0, 0);
		return Math.max(now - 180000, today.getTime() + 1000);
	});

	// Collinear ~127 m steps fit all 4 markers inside the 393px Pixel 5 viewport at zoom 16
	// (preventing mobile MarkerClusterGroup bounds culling) while skipping GraphHopper.
	const [a, b] = await seedKnownEntries(page, request, [
		{ user: 'LA', lat: 50, lon: 8, speed: 1, timestamp: start },
		{ user: 'LB', lat: 50.0009, lon: 8.0011, speed: 2, timestamp: start + 40000 },
	]);
	expect([a.index, b.index]).toEqual([0, 1]);
	expect([a.ignore, b.ignore]).toEqual([false, false]);
	expect([a.speed.gps, b.speed.gps]).toEqual([1, 2]);
	expect(b.time.diff).toBe(40);
	expect(b.distance.horizontal).toBeGreaterThan(22);
	expect(b.speed.horizontal!).toBeLessThan(b.speed.gps * 3.6);
	expect(b.path?.coordinates).toBeUndefined();

	const baseline = await openEntries(page);
	expect(baseline).toEqual([a, b]);
	const documentStarted = await page.evaluate(() => performance.timeOrigin);

	const map = page.locator('.mapContainer');
	await expect(entryMarker(page, b)).toBeVisible();
	// Fresh latest entries auto-open a popup after 150ms; wait for and close it so it cannot cover or pan segments.
	await expect(map.locator('.leaflet-popup')).toBeVisible();
	await closePopups(page);

	// Use a real dark map layer so the fastest white line contrasts with the map.
	const layers = map.locator('.leaflet-control-layers');
	const darkLayer = layers.getByLabel('Stadia AlidadeSmoothDark', { exact: true });
	await expect(async () => {
		if (!await darkLayer.isVisible()) { await layers.locator('.leaflet-control-layers-toggle').press('Enter'); }
		await darkLayer.press('Space');
		await expect(darkLayer).toBeChecked({ timeout: 1000 });
	}).toPass({ timeout: 5000 });

	for (let zoom = 14; zoom <= 16; zoom++) {
		await map.getByRole('button', { name: 'Zoom in', exact: true }).press('Enter');
		await expect(map.locator(`.leaflet-tile-container[style*="z-index: 19"] img.leaflet-tile[src*="/${zoom}/"]`).first()).toBeAttached();
		await expect(map.locator('.leaflet-map-pane')).not.toHaveClass(/leaflet-zoom-anim/);
	}

	await expect(entryMarker(page, b).locator('.icon')).toHaveClass(/\bend\b/);
	await expectSegmentColor(page, a, b, [255, 255, 255]);

	// Wait for the poll that actually contains the new entry rather than an earlier in-flight poll.
	const waitForPoll = (index: number, user: string, timestamp: number) => page.waitForResponse(async response => {
		const url = new URL(response.url());
		if (url.pathname !== '/read' || url.searchParams.get('index') !== String(index) || !response.ok()) { return false; }
		const { entries } = await response.json() as Models.IEntries;
		return entries.some(entry => entry.user === user && entry.time.created === timestamp);
	}, { timeout: 125000 });

	let pending = waitForPoll(b.index, 'LC', start + 80000);
	const [c] = await seedKnownEntries(page, request, [{
		user: 'LC', lat: 50.0018, lon: 8.0022, speed: 20, timestamp: start + 80000,
	}]);
	expect(c.index).toBe(2);
	expect(c.ignore).toBe(false);
	expect(c.speed.gps).toBe(20);
	expect(c.time.diff).toBe(40);
	expect(c.distance.horizontal).toBeGreaterThan(22);
	expect(c.path?.coordinates).toBeUndefined();
	expect(await readEntries(page, request)).toEqual([a, b, c]);

	let response = await pending;
	expect(response.request().method()).toBe('GET');
	expect(await response.json()).toEqual({ entries: [b, c] });
	await expect(entryMarker(page, b).locator('.icon')).toHaveClass(/\bnone\b/);
	await expect(entryMarker(page, c).locator('.icon')).toHaveClass(/\bend\b/);
	await expect(map.locator('.leaflet-popup')).toBeVisible();
	await closePopups(page);
	await expectSegmentColor(page, a, b, [238, 0, 62]);
	await expectSegmentColor(page, b, c, [255, 255, 255]);

	pending = waitForPoll(c.index, 'LD', start + 120000);
	const [d] = await seedKnownEntries(page, request, [{
		user: 'LD', lat: 50.0027, lon: 8.0033, speed: 200, timestamp: start + 120000,
	}]);
	expect(d.index).toBe(3);
	expect(d.ignore).toBe(false);
	expect(d.speed.gps).toBe(200);
	expect(d.time.diff).toBe(40);
	expect(d.distance.horizontal).toBeGreaterThan(22);
	expect(d.path?.coordinates).toBeUndefined();
	expect(await readEntries(page, request)).toEqual([a, b, c, d]);

	response = await pending;
	expect(response.request().method()).toBe('GET');
	// Neither endpoint of A → B was refetched, but its color must change again.
	expect(await response.json()).toEqual({ entries: [c, d] });
	await expect(entryMarker(page, c).locator('.icon')).toHaveClass(/\bnone\b/);
	await expect(entryMarker(page, d).locator('.icon')).toHaveClass(/\bend\b/);
	await expect(map.locator('.leaflet-popup')).toBeVisible();
	await closePopups(page);
	await expectSegmentColor(page, a, b, [231, 0, 117]);
	await expectSegmentColor(page, b, c, [238, 0, 62]);
	await expectSegmentColor(page, c, d, [255, 255, 255]);
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStarted);
});
