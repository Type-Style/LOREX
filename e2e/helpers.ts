import { APIRequestContext, APIResponse, Page, expect } from '@playwright/test';

// The dev server accepts the literal write key "test" while NODE_ENV=development (same convention as src/tests/integration.test.ts). 
const writeKey = 'test';

// Every param /write validates (src/models/entry.ts). checkExact() rejects
// unknown query params, so this list must stay in sync with the server
export interface WriteParams {
	user?: string;
	lat?: number | string;
	lon?: number | string;
	timestamp?: number; // defaults to Date.now() at build time
	hdop?: number | string;
	altitude?: number | string;
	speed?: number | string;
	heading?: number | string;
	key?: string;
	eta?: number;
	eda?: number;
}

// checkNumber caps values at 12 characters
const format = (value: number | string) => (typeof value === 'number' ? value.toFixed(4) : value);

export function buildWriteUrl(params: WriteParams = {}): string {
	const {
		user = 'xx',
		lat = 50,
		lon = 8,
		timestamp = Date.now(),
		hdop = 2,
		altitude = 100,
		speed = 5,
		heading = 90,
		key = writeKey,
	} = params;

	const query = new URLSearchParams({
		user,
		lat: format(lat),
		lon: format(lon),
		timestamp: String(timestamp),
		hdop: format(hdop),
		altitude: format(altitude),
		speed: format(speed),
		heading: format(heading),
		key,
	});
	if (params.eta !== undefined) { query.set('eta', String(params.eta)); }
	if (params.eda !== undefined) { query.set('eda', String(params.eda)); }

	return `/write?${query}`;
}

// Sends the entry and asserts the server accepted it; 
// label distinguishes multiple writes in one test ("A", "B") in the failure message.
export async function writeEntry(request: APIRequestContext, params: WriteParams = {}, label = ''): Promise<APIResponse> {
	const response = await request.get(buildWriteUrl(params));
	expect(response.ok(), `/write${label && ` ${label}`} answered ${response.status()}`).toBeTruthy();
	return response;
}


// Full UI login with the dev-only TEST
export async function uiLogin(page: Page): Promise<void> {
	await page.goto('/login');
	await page.getByLabel('Username').fill('TEST');
	await page.getByLabel('Password').fill('test');
	await page.getByRole('button', { name: 'Login' }).click();
	await expect(page.getByText('Logged In')).toBeVisible();
}

// Reads today's entries through the API with the jwt the UI login stored
export async function readEntries(page: Page, request: APIRequestContext): Promise<Models.IEntry[]> {
	const jwt = await page.evaluate(() => localStorage.getItem('jwt'));
	expect(jwt, 'login must have stored a jwt').toBeTruthy();
	const response = await request.get('/read?index=0', { headers: { Authorization: `Bearer ${jwt}` } });
	expect(response.ok(), `/read answered ${response.status()}`).toBeTruthy();
	const { entries } = (await response.json()) as Models.IEntries;
	return entries;
}

// Seed and reload only when a data-dependent test finds no entries.
// Empty-state tests stub their read instead; existing server data is never cleared.
export async function seedIfEmpty(page: Page, request: APIRequestContext): Promise<Models.IEntry[]> {
	let entries = await readEntries(page, request);
	if (entries.length === 0) {
		await writeEntry(request);
		await page.reload();
		entries = await readEntries(page, request);
	}
	return entries;
}

export async function seedKnownEntries(page: Page, request: APIRequestContext, params: WriteParams[]): Promise<Models.IEntry[]> {
	const existing = await readEntries(page, request);
	expect(existing.length + params.length, 'server data is at the append cap; use an isolated E2E server').toBeLessThanOrEqual(1000);
	const start = Date.now() - params.length * 60000;
	const writes = params.map((param, index) => ({
		user: `E${index}`, lat: 50 + existing.length * 0.002, lon: 8 + index * 0.012, heading: (existing.length + index) % 360,
		timestamp: start + index * 60000, ...param,
	}));
	for (const [index, param] of writes.entries()) {
		await writeEntry(request, param, String(index));
	}
	const entries = await readEntries(page, request);
	return writes.map(param => {
		const matches = entries.filter(entry => entry.time.created === param.timestamp && entry.user === param.user);
		expect(matches, 'each successful write must actually be persisted exactly once').toHaveLength(1);
		const entry = matches[0];
		expect(entry).toMatchObject({ lat: Number(format(param.lat)), lon: Number(format(param.lon)), heading: param.heading });
		return entry;
	});
}

// Disable freshness auto-opening without pausing timers or modifying server responses.
export async function ageEntries(page: Page, entries: Models.IEntry[]): Promise<void> {
	await page.clock.setFixedTime(Math.max(Date.now(), ...entries.map(entry => entry.time.recieved)) + 120000);
}

export async function openEntries(page: Page, url = '/'): Promise<Models.IEntry[]> {
	const pending = page.waitForResponse(response => new URL(response.url()).pathname === '/read');
	await page.goto(url);
	const response = await pending;
	expect(response.ok()).toBeTruthy();
	expect(await response.finished()).toBeNull();
	const { entries } = await response.json() as Models.IEntries;
	await expect(page.locator('.subinfo').getByRole('progressbar')).toBeVisible();
	return entries;
}

export function entryMarker(page: Page, entry: Models.IEntry) {
	return page.locator('.mapContainer .customMarker').filter({ has: page.locator(`[data-entry-index="${entry.index}"]`) });
}

export async function closePopups(page: Page): Promise<void> {
	// Keyboard activation reaches the close control even beneath mobile overlay controls.
	await expect(async () => {
		for (const close of await page.getByRole('button', { name: 'Close popup', exact: true }).all()) {
			await close.press('Enter');
		}
		await expect(page.locator('.mapContainer .leaflet-popup')).toHaveCount(0, { timeout: 500 });
	}).toPass({ timeout: 5000 });
}

export async function expectPopupEntry(page: Page, entry: Models.IEntry): Promise<void> {
	const popup = page.locator('.mapContainer .leaflet-popup');
	await expect(popup).toHaveCount(1);
	await expect(popup).toBeVisible();
	const info = popup.getByRole('tab', { name: 'info', exact: true });
	if (await info.getAttribute('aria-selected') !== 'true') { await info.click(); }
	await expect(popup.locator('dt').filter({ hasText: /^index$/ }).locator('+ dd button')).toHaveText(String(entry.index));
	await expect(popup.locator('dt').filter({ hasText: /^User$/ }).locator('+ dd')).toHaveText(entry.user);
	await expect(popup.locator('a.info')).toHaveText(`${entry.lat.toFixed(4)} / ${entry.lon.toFixed(4)}`);
}
