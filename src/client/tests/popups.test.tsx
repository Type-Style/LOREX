import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ActionContext, Context } from '../context';
import PopupInfo from '../components/Popup_info';
import PopupSpeed from '../components/Popup_speed';
import PopupTime from '../components/Popup_time';
import PopupDistance from '../components/Popup_distance';
import { makeContext, makeEntry } from './testUtils';

// These display-only fixtures never update entries; ignore actions are tested separately.
const ignoreEntryUpdates = () => {};

// Presentational contents use the same definition-list structure as PopupContent.
// Ignore actions are exercised separately in ignoreData.test.
function renderPopup(ui: React.ReactElement) {
	const contextObj = makeContext();
	const actionContext: client.ActionContext = { entries: [], setEntries: ignoreEntryUpdates };
	return render(
		<Context value={[contextObj]}>
			<ActionContext value={[actionContext]}><dl className="popupList">{ui}</dl></ActionContext>
		</Context>
	);
}

function expectRows(container: HTMLElement, expected: Record<string, string>) {
	const list = container.querySelector('dl')!;
	const nodes = Array.from(list.childNodes);
	// Text nodes (notably a leaked numeric zero) become anonymous grid items in the popup.
	expect(nodes.map(node => node.nodeName)).toEqual(Object.keys(expected).flatMap(() => ['DT', 'DD']));
	expect(nodes.map(node => node.textContent?.replace(/\s+/g, ' ').trim())).toEqual(Object.entries(expected).flat());
}

const created = Date.UTC(2025, 4, 12, 10, 20, 30);
const popupEntries = [
	makeEntry({
		index: 0, user: 'FIRST', lat: 50.123456, lon: 8.987654, altitude: 123.45,
		address: 'First Street, North Town', hdop: 1,
		speed: { gps: 10.123, horizontal: 12, vertical: 1.25, total: 12.065, path: 13.456, maxSpeed: 100 },
		distance: { horizontal: 360, vertical: 37.5, total: 361.948, path: 403.68 },
		time: { created, recieved: created + 550, uploadDuration: 0.55, diff: 30, path: 30450, createdString: '10:20:30' },
		eta: created + 600000, eda: 2543.21,
	}),
	makeEntry({
		index: 1, user: 'SECOND', lat: -33.865143, lon: 151.2099, altitude: -12.36,
		address: 'Second Street, South Town', hdop: 4,
		speed: { gps: 6.789, horizontal: 3, vertical: -0.5, total: 3.041, path: 3.579, maxSpeed: 50 },
		distance: { horizontal: 2100, vertical: -350, total: 2128.966, path: 2505.3 },
		time: { created: created + 700000, recieved: created + 701250, uploadDuration: 1.25, diff: 700, path: 700125, createdString: '10:32:10' },
		eta: created + 1200000, eda: 1234.56,
	}),
];

describe('PopupInfo', () => {
	it.each(popupEntries)('shows every info row and the exact OSM destination for entry $index', (entry) => {
		const expected = {
			coordinates: `${entry.lat.toFixed(4)} / ${entry.lon.toFixed(4)}`,
			url: `https://www.openstreetmap.org/?mlat=${entry.lat}&mlon=${entry.lon}&zoom=12&marker=${entry.lat}/${entry.lon}#map=13/${entry.lat}/${entry.lon}`,
			address: entry.address,
			height: `${entry.altitude.toFixed(1)} m`,
			precision: `${entry.hdop} ${entry.hdop < 3.25 ? 'good' : 'ok'}`,
			user: entry.user,
			index: String(entry.index),
		};
		const { container } = renderPopup(<PopupInfo entry={entry} />);

		const link = screen.getByRole('link', { name: expected.coordinates });
		expect(link).toHaveAttribute('href', expected.url);
		const url = new URL(link.getAttribute('href')!);
		expect(url.origin).toBe('https://www.openstreetmap.org');
		expect(url.searchParams.get('mlat')).toBe(String(entry.lat));
		expect(url.searchParams.get('mlon')).toBe(String(entry.lon));
		expectRows(container, {
			'Lat / Lon': expected.coordinates + expected.address,
			Height: expected.height,
			Precision: expected.precision,
			User: expected.user,
			index: expected.index,
			ignore: 'ResetBeforeSelfAfter',
		});
	});

	it.each([{ lat: 0, lon: 8 }, { lat: 50, lon: 0 }, { lat: 0, lon: 0 }])(
		'keeps zero coordinates ($lat, $lon), height, precision and index inside their rows', ({ lat, lon }) => {
			const entry = makeEntry({ lat, lon, altitude: 0, hdop: 0, index: 0, address: '' });
			const expected = {
				coordinates: `${entry.lat.toFixed(4)} / ${entry.lon.toFixed(4)}`,
				url: `https://www.openstreetmap.org/?mlat=${entry.lat}&mlon=${entry.lon}&zoom=12&marker=${entry.lat}/${entry.lon}#map=13/${entry.lat}/${entry.lon}`,
			};
			const { container } = renderPopup(<PopupInfo entry={entry} />);

			expect(screen.getByRole('link', { name: expected.coordinates })).toHaveAttribute('href', expected.url);
			expectRows(container, {
				'Lat / Lon': expected.coordinates,
				Height: `${entry.altitude.toFixed(1)} m`,
				Precision: `${entry.hdop} good`,
				User: entry.user,
				index: String(entry.index),
				ignore: 'ResetBeforeSelfAfter',
			});
		}
	);

	it.each([
		{ hdop: 1, status: 'good', alert: false },
		{ hdop: 3.25, status: 'ok', alert: false },
		{ hdop: 6, status: 'bad', alert: true },
	])('labels precision $hdop as $status', ({ hdop, status, alert }) => {
		const { container } = renderPopup(<PopupInfo entry={makeEntry({ hdop })} />);
		const precision = container.querySelector('.hdop-status');
		expect(precision).toHaveTextContent(`${hdop} ${status}`);
		expect(precision?.classList.contains('alert')).toBe(alert);
	});
});

describe('PopupSpeed', () => {
	it.each(popupEntries)('shows all speed measurements in km/h for entry $index', (entry) => {
		const expected = {
			GPS: `${(entry.speed.gps * 3.6).toFixed(1)} km/h`,
			Calculated: `${(entry.speed.total! * 3.6).toFixed(1)} km/h`,
			Path: `${(entry.speed.path! * 3.6).toFixed(1)} km/h`,
			Vertical: `${(entry.speed.vertical! * 3.6).toFixed(1)} km/h`,
			MaxSpeed: `${entry.speed.maxSpeed!.toFixed(1)} km/h`,
		};
		const { container } = renderPopup(<PopupSpeed entry={entry} />);
		expectRows(container, expected);
	});

	it('has no calculated speed before distance and elapsed time between points are available', () => {
		const entry = makeEntry({
			distance: { horizontal: 0, vertical: 0, total: 0 },
			time: { ...popupEntries[0].time, diff: undefined },
			speed: { gps: 10, horizontal: 0, vertical: 0, total: undefined, maxSpeed: 100 },
		});
		const { container } = renderPopup(<PopupSpeed entry={entry} />);

		expect(screen.queryByText('Calculated')).not.toBeInTheDocument();
		expectRows(container, {
			GPS: `${(entry.speed.gps * 3.6).toFixed(1)} km/h`,
			Vertical: `${(entry.speed.vertical! * 3.6).toFixed(1)} km/h`,
			MaxSpeed: `${entry.speed.maxSpeed!.toFixed(1)} km/h`,
		});
	});

	it('shows zero calculated speed for a stationary second entry without leaking a hidden speed limit', () => {
		const entry = makeEntry({ index: 1, speed: { gps: 0, horizontal: 0, vertical: 0, total: 0, path: 0, maxSpeed: 0 } });
		const { container } = renderPopup(<PopupSpeed entry={entry} />);
		expectRows(container, { GPS: '0.0 km/h', Calculated: '0.0 km/h', Path: '0.0 km/h', Vertical: '0.0 km/h' });
	});

	it.each([
		{ gps: 28.5, shouldAlert: true },
		{ gps: 10, shouldAlert: false },
	])('alerts the speed limit only when exceeded (GPS $gps m/s)', ({ gps, shouldAlert }) => {
		const entry = makeEntry({ hdop: 1, speed: { gps, horizontal: 0, vertical: 0, total: 0, maxSpeed: 100 } });
		renderPopup(<PopupSpeed entry={entry} />);
		const limit = within(screen.getByText('MaxSpeed').nextElementSibling as HTMLElement)
			.getByText(`${entry.speed.maxSpeed!.toFixed(1)} km/h`);
		expect(limit.classList.contains('alert')).toBe(shouldAlert);
	});
});

describe('PopupTime', () => {
	it.each(popupEntries)('shows every timestamp and duration for entry $index', (entry) => {
		const expected = {
			Created: new Date(entry.time.created).toLocaleTimeString('de-DE', {
				weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
			}),
			Recieved: new Date(entry.time.recieved).toLocaleTimeString('de-DE', {
				hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
			}),
			Upload: `${entry.time.uploadDuration.toFixed(1)}s`,
			Diff: `${entry.time.diff!.toFixed(1)} s`,
			'Path Time': `${(entry.time.path! / 1000).toFixed(1)}s`,
			ETA: new Date(entry.eta!).toLocaleString(),
		};
		const { container } = renderPopup(<PopupTime entry={entry} />);
		expectRows(container, expected);
	});

	it.each([undefined, 0, -1])('omits unavailable elapsed time and ETA (%s) without stray text', (value) => {
		const entry = makeEntry({ time: { ...popupEntries[0].time, uploadDuration: 0, diff: value, path: 0 }, eta: value });
		const { container } = renderPopup(<PopupTime entry={entry} />);
		expectRows(container, {
			Created: new Date(entry.time.created).toLocaleTimeString('de-DE', {
				weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit',
				hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
			}),
			Recieved: new Date(entry.time.recieved).toLocaleTimeString('de-DE', {
				hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
			}),
			Upload: '0.0s',
			'Path Time': '0.0s',
		});
	});
});

describe('PopupDistance', () => {
	it.each(popupEntries)('shows all distances through entry $index, excluding later points', (entry) => {
		const entriesThroughCurrent = popupEntries.slice(0, entry.index + 1);
		const ongoing = entriesThroughCurrent.reduce((sum, point) => sum + point.distance.horizontal, 0);
		const withoutPause = entriesThroughCurrent.filter(point => point.time.diff! < 600)
			.reduce((sum, point) => sum + point.distance.horizontal, 0);
		const expected = {
			Separation: `${(entry.distance.total / 1000).toFixed(2)} km`,
			Horizontal: `${(entry.distance.horizontal / 1000).toFixed(2)} km`,
			Vertical: `${(entry.distance.vertical / 1000).toFixed(1)} km`,
			Path: `${(entry.distance.path! / 1000).toFixed(2)} km`,
			Ongoing: `${(ongoing / 1000).toFixed(2)} kmw/o Pause: ${(withoutPause / 1000).toFixed(2)} km`,
			EDA: `${(entry.eda! / 1000).toFixed(3)} km`,
		};
		const laterEntry = makeEntry({ index: 2, distance: { horizontal: 9000, vertical: 0, total: 9000 } });
		const { container } = renderPopup(<PopupDistance entry={entry} cleanEntries={[...popupEntries, laterEntry]} />);
		expectRows(container, expected);
	});

	it('shows zero movement distances for a stationary second entry while omitting zero remaining distance', () => {
		const firstEntry = makeEntry();
		const entry = makeEntry({ index: 1, distance: { horizontal: 0, vertical: 0, total: 0, path: 0 }, eda: 0 });
		const { container } = renderPopup(<PopupDistance entry={entry} cleanEntries={[firstEntry, entry]} />);
		expectRows(container, {
			Separation: '0.00 km',
			Horizontal: '0.00 km',
			Vertical: '0.0 km',
			Path: '0.00 km',
			Ongoing: '0.00 kmw/o Pause: 0.00 km',
		});
	});

	it('renders the no-distance fallback when the entry has no distance', () => {
		const stripped: Partial<Models.IEntry> = makeEntry();
		delete stripped.distance;
		const { container } = renderPopup(<PopupDistance entry={stripped as Models.IEntry} cleanEntries={[]} />);
		expect(screen.getByText('No distance')).toBeInTheDocument();
		expect(Array.from(container.querySelector('dl')!.childNodes, node => node.nodeName)).toEqual(['DT']);
	});
});
