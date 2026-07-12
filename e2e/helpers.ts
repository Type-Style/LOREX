import { APIRequestContext, APIResponse, Page, expect } from '@playwright/test';

// The dev server accepts the literal write key "test" while NODE_ENV=development
// (same convention as src/tests/integration.test.ts). The KEY env var holds the
// base64-encoded key and must NOT be sent raw - see checkKey in src/models/entry.ts.
const writeKey = 'test';

// Every param /write validates (src/models/entry.ts). checkExact() rejects
// unknown query params, so this list must stay in sync with the server.
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
}

// checkNumber caps values at 12 characters, so computed floats (50 + n * 0.005
// accumulates binary noise like 50.245000000000005) must be rounded
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
	return `/write?${query}`;
}

// Sends the entry and asserts the server accepted it; label distinguishes
// multiple writes in one test ("A", "B") in the failure message.
export async function writeEntry(request: APIRequestContext, params: WriteParams = {}, label = ''): Promise<APIResponse> {
	const response = await request.get(buildWriteUrl(params));
	expect(response.ok(), `/write${label && ` ${label}`} answered ${response.status()}`).toBeTruthy();
	return response;
}

// Reads today's entries through the API with the jwt the UI login stored -
// the server state, not the UI, decides seeding/skipping in the specs.
export async function readEntries(page: Page, request: APIRequestContext): Promise<Models.IEntry[]> {
	const jwt = await page.evaluate(() => localStorage.getItem('jwt'));
	expect(jwt, 'login must have stored a jwt').toBeTruthy();
	const response = await request.get('/read?index=0', { headers: { Authorization: `Bearer ${jwt}` } });
	expect(response.ok(), `/read answered ${response.status()}`).toBeTruthy();
	const { entries } = (await response.json()) as Models.IEntries;
	return entries;
}

// E2e runs against a clean server (npm run test:postClear) and owns its data:
// writes one default entry when the day is still empty, so specs that only read
// find something to assert on. Reloads so the already-open page picks it up.
// ONLY for specs whose assertions need data to exist. Never call it (or writeEntry)
// in a spec that asserts the empty or logged-out state - no-data specs stub the
// entries fetch instead of relying on an empty server (see noData.spec.ts).
export async function seedIfEmpty(page: Page, request: APIRequestContext): Promise<Models.IEntry[]> {
	let entries = await readEntries(page, request);
	if (entries.length === 0) {
		await writeEntry(request);
		await page.reload();
		entries = await readEntries(page, request);
	}
	return entries;
}
