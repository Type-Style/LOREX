import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ActionContext, Context } from '../context';
import PopupInfo from '../components/Popup_info';
import PopupSpeed from '../components/Popup_speed';
import PopupTime from '../components/Popup_time';
import PopupDistance from '../components/Popup_distance';
import { makeContext, makeEntry } from './testUtils';

const noop = () => {};

/**
 * Popup tab contents are pure presentational components fed a single entry -
 * no map, no server. PopupInfo alone pulls useIgnoreData, so both contexts are
 * provided; the ignore buttons are not exercised here (covered by ignoreData.test).
 */
function renderPopup(ui: React.ReactElement) {
	const contextObj = makeContext();
	const actionContext: client.ActionContext = { entries: [], setEntries: noop, showIgnored: false, setShowIgnored: noop };
	return render(
		<Context value={[contextObj]}>
			<ActionContext value={[actionContext]}>{ui}</ActionContext>
		</Context>
	);
}

describe('PopupInfo', () => {
	it('links the coordinates to openstreetmap with 4-decimal lat/lon', () => {
		const { container } = renderPopup(<PopupInfo entry={makeEntry({ lat: 50.123456, lon: 8.987654 })} />);

		const link = container.querySelector('a.info');
		expect(link).toHaveAttribute('href', expect.stringContaining('mlat=50.123456'));
		expect(link).toHaveTextContent('50.1235 / 8.9877');
	});

	it('shows the address and the height to one decimal', () => {
		renderPopup(<PopupInfo entry={makeEntry({ altitude: 123.45, address: 'Test Street, Test Town' })} />);

		expect(screen.getByText('Test Street, Test Town')).toBeInTheDocument();
		expect(screen.getByText('123.5 m')).toBeInTheDocument();
	});

	it('labels precision good/ok/bad and only alerts on bad', () => {
		const good = renderPopup(<PopupInfo entry={makeEntry({ hdop: 1 })} />);
		expect(good.container.querySelector('.hdop-status')).toHaveTextContent('good');
		expect(good.container.querySelector('.hdop-status')).not.toHaveClass('alert');

		const ok = renderPopup(<PopupInfo entry={makeEntry({ hdop: 4 })} />);
		expect(ok.container.querySelector('.hdop-status')).toHaveTextContent('ok');
		expect(ok.container.querySelector('.hdop-status')).not.toHaveClass('alert');

		const bad = renderPopup(<PopupInfo entry={makeEntry({ hdop: 8 })} />);
		expect(bad.container.querySelector('.hdop-status')).toHaveTextContent('bad');
		expect(bad.container.querySelector('.hdop-status')).toHaveClass('alert');
	});
});

describe('PopupSpeed', () => {
	it('converts gps speed to km/h and shows the calculated row only with a total', () => {
		render(<PopupSpeed entry={makeEntry({ speed: { gps: 10, horizontal: 0, vertical: 0, total: 20, maxSpeed: 100 } })} />);

		expect(screen.getByText('Calculated').nextElementSibling).toHaveTextContent('72.0 km/h'); // 20 * 3.6
		expect(screen.getByText('GPS').nextElementSibling).toHaveTextContent('36.0 km/h'); // 10 * 3.6
	});

	it('omits the calculated row when there is no total speed', () => {
		render(<PopupSpeed entry={makeEntry({ speed: { gps: 10, horizontal: 0, vertical: 0, total: 0, maxSpeed: 100 } })} />);

		expect(screen.queryByText('Calculated')).not.toBeInTheDocument();
	});

	it('alerts the max-speed row only when the entry exceeds the limit', () => {
		// 28.5 m/s -> 102.6 km/h -> floor 102 - hdop 1 -> 101 > 100 (mirrors exceed() in scripts.test)
		const speeding = render(<PopupSpeed entry={makeEntry({ hdop: 1, speed: { gps: 28.5, horizontal: 0, vertical: 0, total: 0, maxSpeed: 100 } })} />);
		expect(within(speeding.container).getByText('100.0 km/h')).toHaveClass('alert');

		const cruising = render(<PopupSpeed entry={makeEntry({ hdop: 1, speed: { gps: 10, horizontal: 0, vertical: 0, total: 0, maxSpeed: 100 } })} />);
		expect(within(cruising.container).getByText('100.0 km/h')).not.toHaveClass('alert');
	});
});

describe('PopupTime', () => {
	it('formats upload duration and time diff', () => {
		render(<PopupTime entry={makeEntry({ time: { created: Date.now(), recieved: Date.now(), uploadDuration: 0.5, diff: 30, createdString: '12:00' } })} />);

		expect(screen.getByText('Upload').nextElementSibling).toHaveTextContent('0.5s');
		expect(screen.getByText('Diff').nextElementSibling).toHaveTextContent('30.0 s');
	});

	it('shows the ETA row only for a positive eta', () => {
		const withEta = render(<PopupTime entry={makeEntry({ eta: Date.now() + 600000 })} />);
		expect(within(withEta.container).getByText('ETA')).toBeInTheDocument();

		const withoutEta = render(<PopupTime entry={makeEntry({ eta: undefined })} />);
		expect(within(withoutEta.container).queryByText('ETA')).not.toBeInTheDocument();
	});
});

describe('PopupDistance', () => {
	it('shows separation in km and the ongoing distance without pause', () => {
		const entries = [
			makeEntry({ index: 0, distance: { horizontal: 1000, vertical: 0, total: 1000 } }),
			makeEntry({ index: 1, distance: { horizontal: 2000, vertical: 0, total: 2000 } }),
		];

		render(<PopupDistance entry={entries[1]} cleanEntries={entries} />);

		expect(screen.getByText('Separation').nextElementSibling).toHaveTextContent('2.00 km'); // 2000 / 1000
		expect(screen.getByText('Ongoing').nextElementSibling).toHaveTextContent('3.00 km'); // 1 + 2 km summed
	});

	it('renders the no-distance fallback when the entry has no distance', () => {
		const stripped: Partial<Models.IEntry> = makeEntry();
		delete stripped.distance;

		render(<PopupDistance entry={stripped as Models.IEntry} cleanEntries={[]} />);

		expect(screen.getByText('No distance')).toBeInTheDocument();
	});
});
