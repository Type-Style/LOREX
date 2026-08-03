import { afterEach, describe, expect, it } from 'vitest';
import { timeAgo } from '../scripts/timeAgo';
import { getDistance } from '../scripts/getDistance';
import { getMaxSpeed } from '../scripts/maxSpeed';
import { convertJwt } from '../scripts/convertJwt';
import { layers } from '../scripts/layers';
import { makeEntry, makeFakeJwt } from './testUtils';

describe('timeAgo', () => {
	it('returns empty string for non-integer input', () => {
		expect(timeAgo(NaN)).toBe('');
		expect(timeAgo(1.5)).toBe('');
	});

	it('labels a fresh timestamp as instant', () => {
		const now = Date.now();

		expect(timeAgo(now)).toBe('Instant');
	});

	it('switches labels exactly at the range boundaries', () => {
		const lastInstantSecond = Date.now() - 7 * 1000;
		const firstJustNowSecond = Date.now() - 8 * 1000;
		const firstMomentAgoSecond = Date.now() - 25 * 1000;

		expect(timeAgo(lastInstantSecond)).toBe('Instant');
		expect(timeAgo(firstJustNowSecond)).toBe('Just now');
		expect(timeAgo(firstMomentAgoSecond)).toBe('a moment ago');
	});

	it('shows correctly rounded minutes, hours and days past the label limit', () => {
		const firstMinute = Date.now() - 50 * 1000; // "a moment ago" ends at 49s, 50s rounds to 1 minute
		const lastSingleMinute = Date.now() - 89 * 1000; // 1.48 minutes still rounds down
		const firstTwoMinutes = Date.now() - 90 * 1000; // 1.5 minutes rounds up
		const lastMinuteValue = Date.now() - (59 * 60 + 29) * 1000; // 59.48 minutes rounds to 59
		const firstHour = Date.now() - (59 * 60 + 30) * 1000; // 59.5 minutes rounds to 60 and switches unit
		const lastHourValue = Date.now() - (23 * 3600 + 29 * 60) * 1000; // 23.48 hours rounds to 23
		const firstDay = Date.now() - (23 * 3600 + 30 * 60) * 1000; // 23.5 hours rounds to 24 and switches unit

		expect(timeAgo(firstMinute)).toBe('1 minute ago');
		expect(timeAgo(lastSingleMinute)).toBe('1 minute ago');
		expect(timeAgo(firstTwoMinutes)).toBe('2 minutes ago');
		expect(timeAgo(lastMinuteValue)).toBe('59 minutes ago');
		expect(timeAgo(firstHour)).toBe('1 hour ago');
		expect(timeAgo(lastHourValue)).toBe('23 hours ago');
		expect(timeAgo(firstDay)).toBe('1 day ago');
	});

	it.each<[number, string]>([
		[15 * 1000, 'Just now'],
		[40 * 1000, 'a moment ago'],
		[60 * 1000, '1 minute ago'],
		[5 * 60 * 1000, '5 minutes ago'],
		[60 * 60 * 1000, '1 hour ago'],
		[5 * 60 * 60 * 1000, '5 hours ago'],
		[24 * 60 * 60 * 1000, '1 day ago'],
		[5 * 24 * 60 * 60 * 1000, '5 days ago'],
		[30 * 24 * 60 * 60 * 1000, '1 month ago'],
		[60 * 24 * 60 * 60 * 1000, '2 months ago'],
		[365 * 24 * 60 * 60 * 1000, '1 year ago'],
		[2 * 365 * 24 * 60 * 60 * 1000, '2 years ago'],
	])('%i ms in the past reads "%s"', (msAgo, expected) => {
		const timestamp = Date.now() - msAgo;

		expect(timeAgo(timestamp)).toBe(expected);
	});
});

describe('getDistance', () => {
	const distEntry = (horizontal: number, diff?: number): Models.IEntry => {
		const entry = makeEntry({ distance: { horizontal, vertical: 0, total: horizontal } });
		entry.time.diff = diff;
		return entry;
	};

	it('sums horizontal distances in kilometers', () => {
		const entries = [distEntry(1000, 30), distEntry(2000, 30), distEntry(3000, 30)];

		const distance = getDistance(entries);

		expect(distance).toBe(6);
	});

	it('slices inclusively when stopPoint is before the end', () => {
		const entries = [distEntry(1000, 30), distEntry(2000, 30), distEntry(3000, 30)];

		const upToSecond = getDistance(entries, 1); // includes entries 0 and 1
		const firstOnly = getDistance(entries, 0); // includes entry 0 only
		const all = getDistance(entries, entries.length);

		expect(upToSecond).toBe(3);
		expect(firstOnly).toBe(1);
		expect(all).toBe(6);
	});

	it('skips entries without a distance object', () => {
		const stripped: Partial<Models.IEntry> = makeEntry();
		delete stripped.distance;
		const entries = [distEntry(1000, 30), stripped as Models.IEntry, distEntry(2000, 30)];

		const distance = getDistance(entries);

		expect(distance).toBe(3);
	});

	it('skips pauses (time.diff >= 600) only when ignorePause is set', () => {
		const entries = [distEntry(1000, 30), distEntry(5000, 650), distEntry(2000, 30)];

		const withoutPause = getDistance(entries, undefined, true);
		const withPause = getDistance(entries, undefined, false);

		expect(withoutPause).toBe(3);
		expect(withPause).toBe(8);
	});

	it('keeps entries with an undefined diff when ignoring pauses', () => {
		const entries = [distEntry(1000), distEntry(500)];

		const distance = getDistance(entries, undefined, true);

		expect(distance).toBe(1.5);
	});
});

describe('getMaxSpeed', () => {
	const gpsEntry = (gps: number): Models.IEntry =>
		makeEntry({ speed: { gps, horizontal: 0, vertical: 0, total: 0, maxSpeed: { value: 100, warning: false, alert: false } } });

	it('returns the highest gps speed converted to km/h', () => {
		const entries = [gpsEntry(10), gpsEntry(25), gpsEntry(15)];
		const expectedKmh = 90; // 25 m/s * 3.6

		expect(getMaxSpeed(entries)).toBeCloseTo(expectedKmh, 9);
	});

	it('works with a single entry', () => {
		const entries = [gpsEntry(10)];
		const expectedKmh = 36; // 10 m/s * 3.6

		expect(getMaxSpeed(entries)).toBeCloseTo(expectedKmh, 9);
	});
});

describe('convertJwt', () => {
	afterEach(() => {
		localStorage.removeItem('jwt');
	});

	it('parses user and exp from a stored token', () => {
		const token = makeFakeJwt({ user: 'TEST', exp: 1234567890 });
		localStorage.setItem('jwt', token);

		expect(convertJwt()).toEqual({ user: 'TEST', exp: 1234567890 });
	});

	it('returns false without a stored token', () => {
		expect(convertJwt()).toBe(false);
	});

	it('returns false for an unparsable token', () => {
		localStorage.setItem('jwt', 'garbage');
		expect(convertJwt()).toBe(false);

		localStorage.setItem('jwt', 'aaa.!!!.bbb');
		expect(convertJwt()).toBe(false);
	});
});

describe('layers', () => {
	it('defines exactly one default light and one default dark layer', () => {
		const lightDefaults = layers.filter((layer) => layer.default === 'light');
		const darkDefaults = layers.filter((layer) => layer.default === 'dark');

		expect(lightDefaults).toHaveLength(1);
		expect(darkDefaults).toHaveLength(1);
	});

	it('provides name, url and attribution for every layer', () => {
		for (const layer of layers) {
			expect(layer.name).toBeTruthy();
			expect(layer.url).toBeTruthy();
			expect(layer.attribution).toBeTruthy();
		}
	});

	it('flags the overlay layers', () => {
		const overlayNames = layers.filter((layer) => layer.overlay).map((layer) => layer.name);

		expect(overlayNames).toEqual(['Traffic Flow', 'OpenRailway']);
	});
});
