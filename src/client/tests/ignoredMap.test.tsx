import React, { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Map from '../components/Map';
import Status from '../components/Status';
import { ActionContext } from '../context';
import { makeContext, makeEntry, renderWithContext } from './testUtils';

function MapWithStatus({ initialEntries }: { initialEntries: Models.IEntry[] }) {
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
const entries = [
	makeEntry({ index: 0, distance: { horizontal: 360, vertical: 0, total: 360 } }),
	makeEntry({ index: 1, distance: { horizontal: 2100, vertical: 0, total: 2100 } }),
	makeEntry({ index: 2, ignore: true, distance: { horizontal: 99000, vertical: 0, total: 99000 } }),
	makeEntry({ index: 3, distance: { horizontal: 9000, vertical: 0, total: 9000 } }),
].map(entry => ({
	...entry,
	speed: { ...entry.speed, gps: 10, horizontal: 10 },
	time: { ...entry.time, created: created + entry.index * 1000, recieved: created, diff: entry.index === 1 ? 700 : 30 },
}));

function renderMap() {
	const { container } = renderWithContext(<MapWithStatus initialEntries={entries} />, makeContext({ userInfo: { user: 'TEST', exp: 9999999999 } }));
	return {
		map: container.querySelector('.mapContainer')!,
		toggle: screen.getByRole('button', { name: 'Show ignored entries on the map' }),
	};
}

const ignoredIcon = (map: Element) => map.querySelector<HTMLElement>('.icon.ignored[data-entry-index="2"]');

// Real Leaflet layers and popup controls, with local input data and no server requests.
describe('Ignored entries on the map', () => {
	beforeEach(() => {
		window.history.replaceState({}, '', '/');
	});

	it('hides the ignored entry by default', () => {
		const { map } = renderMap();
		expect(ignoredIcon(map)).not.toBeInTheDocument();
		expect(map.querySelector('.icon.end')).toHaveAttribute('data-entry-index', '3');
	});

	it('shows the ignored entry when the toggle is clicked', async () => {
		const { map, toggle } = renderMap();
		await userEvent.setup().click(toggle);
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		expect(ignoredIcon(map)).toBeInTheDocument();
	});

	it('hides the ignored entry again on a second click', async () => {
		const user = userEvent.setup();
		const { map, toggle } = renderMap();
		await user.click(toggle);
		await user.click(toggle);
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		await waitFor(() => expect(ignoredIcon(map)).not.toBeInTheDocument());
		expect(map.querySelector('.icon.end')).toHaveAttribute('data-entry-index', '3');
	});

	it('can be toggled by keyboard', async () => {
		const user = userEvent.setup();
		const { map, toggle } = renderMap();
		await user.tab();
		expect(toggle).toHaveFocus();
		await user.keyboard('{Enter}');
		expect(ignoredIcon(map)).toBeInTheDocument();
		await user.keyboard(' ');
		await waitFor(() => expect(ignoredIcon(map)).not.toBeInTheDocument());
	});

	it('opens the ignored marker popup with the distance of the counted entries', async () => {
		const user = userEvent.setup();
		const { map, toggle } = renderMap();
		await user.click(toggle);
		await user.click(ignoredIcon(map)!);
		(await screen.findByRole('tab', { name: 'distance' })).focus();
		await user.keyboard('{Enter}');
		const popup = map.querySelector<HTMLElement>('.leaflet-popup-content')!;
		expect(within(popup).getByText('Ongoing').nextElementSibling).toHaveTextContent('2.46 kmw/o Pause: 0.36 km');
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('2');
	});
});
