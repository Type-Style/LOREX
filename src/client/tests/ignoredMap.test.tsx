import React, { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Map from '../components/Map';
import Status from '../components/Status';
import { ActionContext } from '../context';
import { makeContext, makeEntry, renderWithContext } from './testUtils';

function Trip({ initialEntries }: { initialEntries: Models.IEntry[] }) {
	const [entries, setEntries] = useState(initialEntries);
	const [showIgnored, setShowIgnored] = useState(false);
	return (
		<ActionContext value={[{ entries, setEntries, showIgnored, setShowIgnored }]}>
			<Status entries={entries} ref={null} />
			<Map entries={entries} />
		</ActionContext>
	);
}

const created = Date.UTC(2025, 4, 12, 10);
const tripEntries = [
	makeEntry({ index: 0, distance: { horizontal: 360, vertical: 0, total: 360 } }),
	makeEntry({ index: 1, distance: { horizontal: 2100, vertical: 0, total: 2100 } }),
	makeEntry({ index: 2, ignore: true, distance: { horizontal: 99000, vertical: 0, total: 99000 } }),
	makeEntry({ index: 3, distance: { horizontal: 9000, vertical: 0, total: 9000 } }),
].map(entry => ({
	...entry,
	speed: { ...entry.speed, gps: 10, horizontal: 10 },
	time: { ...entry.time, created: created + entry.index * 1000, recieved: created, diff: entry.index === 1 ? 700 : 30 },
}));

// Real Leaflet layers and popup controls, with local input data and no server requests.
describe('Ignored entries on the map', () => {
	beforeEach(() => {
		window.history.replaceState({}, '', '/');
	});

	it('shows all-ignored data via keyboard without a clean end marker or route, then hides it again', async () => {
		const user = userEvent.setup();
		const entries = tripEntries.map(entry => ({ ...entry, ignore: true }));
		const { container } = renderWithContext(<Trip initialEntries={entries} />, makeContext({ userInfo: { user: 'TEST', exp: 9999999999 } }));
		const toggle = screen.getByRole('button', { name: 'Show ignored entries on the map' });
		expect(screen.getByText('No Data to be displayed')).toBeInTheDocument();
		expect(container.querySelector('.mapContainer')).not.toBeInTheDocument();

		await user.tab();
		expect(toggle).toHaveFocus();
		await user.keyboard('{Enter}');
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(screen.queryByText('No Data to be displayed')).not.toBeInTheDocument();
		const map = container.querySelector('.mapContainer')!;
		expect(map).toBeInTheDocument();
		expect(Array.from(map.querySelectorAll('.icon.ignored'), icon => icon.getAttribute('data-entry-index'))).toEqual(['0', '1', '2', '3']);
		expect(map.querySelector('.icon.end, .icon.start, .customPolyline')).not.toBeInTheDocument();

		await user.keyboard(' ');
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		expect(container.querySelector('.mapContainer')).not.toBeInTheDocument();
		expect(screen.getByText('No Data to be displayed')).toBeInTheDocument();
	});

	it('toggles the ignored marker and opens its real distance popup after nonzero clean travel', async () => {
		const user = userEvent.setup();
		const { container } = renderWithContext(<Trip initialEntries={tripEntries} />, makeContext({ userInfo: { user: 'TEST', exp: 9999999999 } }));
		const map = container.querySelector('.mapContainer')!;
		const toggle = screen.getByRole('button', { name: 'Show ignored entries on the map' });
		expect(map.querySelector('[data-entry-index="2"]')).not.toBeInTheDocument();
		expect(map.querySelector('.icon.end')).toHaveAttribute('data-entry-index', '3');

		await user.click(toggle);
		const ignored = map.querySelector<HTMLElement>('.icon.ignored[data-entry-index="2"]')!;
		expect(ignored).toBeInTheDocument();
		await user.click(ignored);
		(await screen.findByRole('tab', { name: 'distance' })).focus();
		await user.keyboard('{Enter}');
		const popup = map.querySelector<HTMLElement>('.leaflet-popup-content')!;
		expect(within(popup).getByText('Ongoing').nextElementSibling).toHaveTextContent('2.46 kmw/o Pause: 0.36 km');
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('2');

		await user.click(toggle);
		await waitFor(() => expect(map.querySelector('[data-entry-index="2"]')).not.toBeInTheDocument());
		expect(map.querySelector('.icon.end')).toHaveAttribute('data-entry-index', '3');
	});
});
