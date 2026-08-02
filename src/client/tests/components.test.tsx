import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Message } from '../components/Message';
import ModeSwitcher from '../components/ModeSwitcher';
import LinearBuffer from '../components/LinearBuffer';
import { Icon } from '../components/Icon';
import Status from '../components/Status';
import { ActionContext, Context } from '../context';
import { getModeButton, makeContext, makeEntry, renderWithContext } from './testUtils';

describe('Message', () => {
	it('shows status and message on error', () => {
		renderWithContext(<Message messageObj={{ isError: true, status: 403, message: 'No valid login' }} page="start" />);

		expect(screen.getByText('403')).toBeInTheDocument();
		expect(screen.getByText('No valid login')).toBeInTheDocument();
	});

	it('renders every line of a multiline error message', () => {
		renderWithContext(<Message messageObj={{ isError: true, status: 500, message: 'line1\nline2' }} page="start" />);

		expect(screen.getByText('line1')).toBeInTheDocument();
		expect(screen.getByText('line2')).toBeInTheDocument();
	});

	it('welcomes a known user on the start page', () => {
		const contextObj = makeContext({ userInfo: { user: 'TEST', exp: 9999999999 } });
		renderWithContext(<Message messageObj={{ isError: false, status: 200, message: '' }} page="start" />, contextObj);

		expect(screen.getByText('TEST')).toBeInTheDocument();
		expect(screen.getByText('Welcome back')).toBeInTheDocument();
	});

	it('shows a plain message as title on the login page', () => {
		renderWithContext(<Message messageObj={{ isError: false, status: 200, message: 'Success!' }} page="login" />);

		const title = screen.getByText('Success!');
		expect(title.tagName).toBe('STRONG');
		expect(title).toHaveClass('title');
	});

	it('renders an empty message span on the start page without user info', () => {
		const { container } = renderWithContext(<Message messageObj={{ isError: false, status: 200, message: '' }} page="start" />);

		const span = container.querySelector('span.message');
		expect(span).toBeInTheDocument();
		expect(span).toBeEmptyDOMElement();
	});
});

function ModeSwitcherHarness({ initialMode }: { initialMode: string }) {
	const [mode, setMode] = useState<string | undefined>(initialMode);
	const contextObj = makeContext({ mode, setMode: (newMode) => setMode(newMode ?? undefined) });

	return (
		<Context value={[contextObj]}>
			<ModeSwitcher />
		</Context>
	);
}

describe('ModeSwitcher', () => {
	it('shows the current mode and its css-module class', () => {
		render(<ModeSwitcherHarness initialMode="light" />);

		expect(getModeButton('light').className).toMatch(/modeSwitcher/);
	});

	it('toggles from light to dark and back', async () => {
		const user = userEvent.setup();
		render(<ModeSwitcherHarness initialMode="light" />);

		await user.click(getModeButton('light'));
		expect(getModeButton('dark')).toBeInTheDocument();

		await user.click(getModeButton('dark'));
		expect(getModeButton('light')).toBeInTheDocument();
	});
});

describe('LinearBuffer', () => {
	it('reaches 100% within the 1s redirect phase (buffer variant)', async () => {
		const now = Date.now();
		render(<LinearBuffer msStart={now} msFinish={now + 1000} />);

		const bar = screen.getByRole('progressbar');
		await waitFor(() => expect(bar).toHaveAttribute('aria-valuenow', '100'), { timeout: 2500 });
	});

	it('progresses slowly for a long determinate window', async () => {
		const now = Date.now();
		render(<LinearBuffer msStart={now} msFinish={now + 60000} variant="determinate" />);

		const bar = screen.getByRole('progressbar');
		await waitFor(() => {
			expect(Number(bar.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(1);
		}, { timeout: 2500 });

		expect(Number(bar.getAttribute('aria-valuenow'))).toBeLessThan(50);
	});
});

describe('Icon', () => {
	it('rotates by angle when present', () => {
		const icon = Icon({ className: 'dark', iconSize: 40 }, makeEntry({ angle: 45, heading: 90 }));

		expect(String(icon.options.html)).toContain('--angle: 45');
		expect(String(icon.options.html)).toContain('class="icon dark"');
	});

	it('falls back to heading when angle is missing or zero', () => {
		const zeroAngle = Icon({ className: 'dark', iconSize: 40 }, makeEntry({ angle: 0, heading: 90 }));
		expect(String(zeroAngle.options.html)).toContain('--angle: 90');

		const noAngle = Icon({ className: 'dark', iconSize: 40 }, makeEntry({ angle: undefined, heading: 33 }));
		expect(String(noAngle.options.html)).toContain('--angle: 33');
	});

	it('uses the triangle arrow unless the className contains "none"', () => {
		const triangle = Icon({ className: 'light', iconSize: 40 }, makeEntry());
		expect(String(triangle.options.html)).toContain('<polygon');

		const arrow = Icon({ className: 'none', iconSize: 40 }, makeEntry());
		expect(String(arrow.options.html)).toContain('<path');
	});

	it('sizes and anchors the icon around its center', () => {
		const icon = Icon({ className: 'dark', iconSize: 40 }, makeEntry());

		expect(icon.options.iconSize).toEqual([40, 40]);
		expect(icon.options.iconAnchor).toEqual([20, 20]);
		expect(icon.options.className).toBe('customMarker');
	});
});

/** Deterministic Status fixture; every value read by getStatusData is set explicitly. */
function statusEntry(index: number, values: {
	gps: number, horizontal: number, verticalDist: number, horizontalDist: number,
	upload: number, diff: number, ignore?: boolean, eta?: number, eda?: number
}): Models.IEntry {
	return makeEntry({
		index,
		ignore: values.ignore ?? false,
		eta: values.eta,
		eda: values.eda,
		speed: { gps: values.gps, horizontal: values.horizontal, vertical: 0, total: values.horizontal, maxSpeed: 100 },
		distance: { horizontal: values.horizontalDist, vertical: values.verticalDist, total: values.horizontalDist },
		time: { created: Date.now(), recieved: Date.now(), uploadDuration: values.upload, diff: values.diff, createdString: '12:00' },
	});
}

// GPS mean 15m/s*3.6=54.0; calc mean 10m/s*3.6=36.0 (no pause); max 20m/s*3.6=72.0;
// distance 6000m=6.00km; vertical +150m/-200m; upload mean 1.000s
const entriesNoPause = () => [
	statusEntry(0, { gps: 10, horizontal: 10, verticalDist: 100, horizontalDist: 1000, upload: 0.5, diff: 30 }),
	statusEntry(1, { gps: 20, horizontal: 10, verticalDist: -200, horizontalDist: 2000, upload: 1.0, diff: 30 }),
	statusEntry(2, { gps: 15, horizontal: 10, verticalDist: 50, horizontalDist: 3000, upload: 1.5, diff: 30 }),
];

// One ignored entry, one pause (diff 700 >= 600): calc mean 20m/s*3.6=72.0 vs 10m/s*3.6=36.0 without pause;
// distance 6.00km vs 1.00km without pause; GPS mean 7.5m/s*3.6=27.0; max 10m/s*3.6=36.0; upload hidden (0)
const entriesWithPause = () => [
	statusEntry(0, { gps: 5, horizontal: 10, verticalDist: 0, horizontalDist: 1000, upload: 0, diff: 30 }),
	statusEntry(1, { gps: 10, horizontal: 30, verticalDist: 0, horizontalDist: 5000, upload: 0, diff: 700, eta: Date.now() + 600000, eda: 2500 }),
	statusEntry(2, { gps: 99, horizontal: 99, verticalDist: 0, horizontalDist: 99999, upload: 0, diff: 30, ignore: true }),
];

describe('Status', () => {
	it('renders nothing without entries', () => {
		const empty = render(<Status entries={[]} ref={React.createRef()} />);
		expect(empty.container).toBeEmptyDOMElement();

		const missing = render(<Status entries={undefined} ref={React.createRef()} />);
		expect(missing.container).toBeEmptyDOMElement();
	});

	it('computes means, max speed, vertical and distance without pauses', () => {
		render(<Status entries={entriesNoPause()} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow?.textContent).toContain('3(0)');

		expect(screen.getByText('Ø upload').closest('tr')?.textContent).toContain('1.000s');
		expect(screen.getByText('GPS: 54.0km/h')).toBeInTheDocument();
		expect(screen.getByText('Calc: 36.0km/h')).toBeInTheDocument();
		expect(screen.getByText('72.0km/h')).toBeInTheDocument();
		expect(screen.getByText('0.15km up')).toBeInTheDocument();
		expect(screen.getByText('-0.20km down')).toBeInTheDocument();
		expect(screen.getByText('6.00km')).toBeInTheDocument();

		// no pause and no eta/eda: no subtables, no extra rows
		expect(screen.queryAllByText('w/o Pause')).toHaveLength(0);
		expect(screen.queryByText('EDA')).not.toBeInTheDocument();
		expect(screen.queryByText('ETA')).not.toBeInTheDocument();
	});

	it('splits speed and distance into with/without pause and counts ignored entries', () => {
		render(<Status entries={entriesWithPause()} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow?.textContent).toContain('2(1)');

		expect(screen.queryByText('Ø upload')).not.toBeInTheDocument();
		expect(screen.getByText('GPS: 27.0km/h')).toBeInTheDocument();
		expect(screen.getByText('36.0km/h')).toBeInTheDocument();

		// both the speed and the distance subtable show a "w/o Pause" column
		expect(screen.getAllByText('w/o Pause')).toHaveLength(2);
		expect(screen.getByText('72.0')).toBeInTheDocument();
		expect(screen.getByText('36.0')).toBeInTheDocument();
		expect(screen.getByText('6.00')).toBeInTheDocument();
		expect(screen.getByText('1.00')).toBeInTheDocument();

		expect(screen.getByText('EDA').closest('tr')?.textContent).toContain('2.50km');
		expect(screen.getByText('ETA').closest('tr')?.textContent).toMatch(/minutes/);
	});

	it('collapses via the imperative ref handle', () => {
		const ref = React.createRef<{ collapseTable: () => void }>();
		const { container } = render(<Status entries={entriesNoPause()} ref={ref} />);

		const wrapper = container.querySelector('.wrapper');
		expect(wrapper?.className).not.toContain('collapse');

		act(() => ref.current?.collapseTable());
		expect(container.querySelector('.wrapper')?.className).toContain('collapse');
	});
});

/** Real showIgnored state behind the ActionContext so clicking the data row actually toggles it. */
function StatusWithToggle({ entries }: { entries: Models.IEntry[] }) {
	const [showIgnored, setShowIgnored] = useState(false);
	const actionContext: client.ActionContext = { entries, setEntries: () => {}, showIgnored, setShowIgnored };

	return (
		<ActionContext value={[actionContext]}>
			<Status entries={entries} ref={React.createRef()} />
		</ActionContext>
	);
}

describe('Status ignored toggle', () => {
	it('marks the visible count by default and strikes the ignored count', () => {
		const { container } = render(<StatusWithToggle entries={entriesWithPause()} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow).not.toHaveClass('showIgnored');
		expect(container.querySelector('.visibleCount')?.textContent).toBe('2');
		expect(container.querySelector('.ignoredCount')).toHaveClass('strike');
		expect(dataRow?.textContent).toContain('2(1)');
	});

	it('toggles the showIgnored state when the data row is clicked', async () => {
		const user = userEvent.setup();
		render(<StatusWithToggle entries={entriesWithPause()} />);

		const dataRow = screen.getByText('data').closest('tr')!;
		await user.click(dataRow);
		expect(dataRow).toHaveClass('showIgnored');

		await user.click(dataRow);
		expect(dataRow).not.toHaveClass('showIgnored');
	});

	it('does not crash when rendered without an action context', async () => {
		const user = userEvent.setup();
		render(<Status entries={entriesWithPause()} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr')!;
		await user.click(dataRow); // no provider: click is a safe no-op
		expect(dataRow).not.toHaveClass('showIgnored');
	});
});
