import React, { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Message } from '../components/Message';
import ModeSwitcher from '../components/ModeSwitcher';
import LinearBuffer from '../components/LinearBuffer';
import { defaultArrow, Icon, triangleArrow } from '../components/Icon';
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

function ModeSwitcherExample({ initialMode }: { initialMode: string }) {
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
		render(<ModeSwitcherExample initialMode="light" />);

		expect(getModeButton('light').className).toMatch(/modeSwitcher/);
	});

	it('toggles from light to dark and back', async () => {
		const user = userEvent.setup();
		render(<ModeSwitcherExample initialMode="light" />);

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

	// TODO: Rerender the login buffer from the 9s authentication window into its second,
	// 1s redirect phase; verify progress resets and completes while retaining the buffer variant.
});

describe('Icon', () => {
	it('rotates by angle when present', () => {
		const icon = Icon({ className: 'x-addition', iconSize: 40 }, makeEntry({ angle: 45, heading: 90 }));

		expect(String(icon.options.html)).toContain('--angle: 45');
		expect(String(icon.options.html)).toContain('class="icon x-addition"');
	});

	it('preserves a zero-degree angle instead of falling back to heading', () => {
		const zeroAngle = Icon({ iconSize: 40 }, makeEntry({ angle: 0, heading: 90 }));
		expect(String(zeroAngle.options.html)).toContain('--angle: 0');
	});

	it('falls back to heading only when angle is missing', () => {
		const noAngle = Icon({ iconSize: 40 }, makeEntry({ angle: undefined, heading: 33 }));
		expect(String(noAngle.options.html)).toContain('--angle: 33');
	});

	it.each([
		{ className: undefined, expectedArrow: triangleArrow },
		{ className: '', expectedArrow: triangleArrow },
		{ className: 'moving', expectedArrow: triangleArrow },
		{ className: 'none', expectedArrow: defaultArrow },
		{ className: 'marker none', expectedArrow: defaultArrow },
	])('renders the expected arrow for className=$className', ({ className, expectedArrow }) => {
		const marker = Icon({ className, iconSize: 40 }, makeEntry()).createIcon();

		expect(marker.querySelector('.icon')).toHaveAttribute('class', `icon ${className ?? ''}`);
		expect(marker.querySelector('.icon')).toHaveAttribute('data-entry-index', '0');
		expect(marker.querySelector('svg')).toContainHTML(expectedArrow);
		expect(marker.querySelector('svg')?.children).toHaveLength(2);
	});

	it('sizes and anchors the icon around its center', () => {
		const icon = Icon({ iconSize: 40 }, makeEntry());

		expect(icon.options.iconSize).toEqual([40, 40]);
		expect(icon.options.iconAnchor).toEqual([20, 20]);
		expect(icon.options.className).toBe('customMarker');
	});
});

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

const statusWithoutPauses = {
	entries: [
		statusEntry(0, { gps: 10, horizontal: 10, verticalDist: 100, horizontalDist: 1000, upload: 0.5, diff: 30 }),
		statusEntry(1, { gps: 20, horizontal: 10, verticalDist: -200, horizontalDist: 2000, upload: 1.0, diff: 30 }),
		statusEntry(2, { gps: 15, horizontal: 10, verticalDist: 50, horizontalDist: 3000, upload: 1.5, diff: 30 }),
	],
	expected: {
		data: '3(0)',
		uploadMean: '1.000s',
		gpsMean: 'GPS: 54.0km/h',
		calculatedMean: 'Calc: 36.0km/h',
		maxSpeed: '72.0km/h',
		ascent: '0.15km up',
		descent: '-0.20km down',
		distance: '6.00km',
	},
};

const statusWithPauseAndIgnoredEntry = {
	entries: [
		statusEntry(0, { gps: 5, horizontal: 10, verticalDist: 0, horizontalDist: 1000, upload: 0, diff: 30 }),
		statusEntry(1, { gps: 10, horizontal: 30, verticalDist: 0, horizontalDist: 5000, upload: 0, diff: 700,
			eta: Date.UTC(2020, 0, 1, 12, 10), eda: 2500 }),
		statusEntry(2, { gps: 99, horizontal: 99, verticalDist: 0, horizontalDist: 99999, upload: 0, diff: 30, ignore: true }),
	].map(entry => ({ ...entry, time: { ...entry.time, created: Date.UTC(2020, 0, 1, 12) } })),
	expected: {
		data: '2(1)',
		gpsMean: 'GPS: 27.0km/h',
		maxSpeed: '36.0km/h',
		calculatedMean: { total: '72.0', withoutPause: '36.0' },
		distance: { total: '6.00', withoutPause: '1.00' },
		eda: '2.50km',
		eta: '10.0 minutes',
	},
};

describe('Status', () => {
	it('renders nothing without entries', () => {
		const empty = render(<Status entries={[]} ref={React.createRef()} />);
		expect(empty.container).toBeEmptyDOMElement();

		const missing = render(<Status entries={undefined} ref={React.createRef()} />);
		expect(missing.container).toBeEmptyDOMElement();
	});

	it('computes means, max speed, vertical and distance without pauses', () => {
		const { entries, expected } = statusWithoutPauses;
		render(<Status entries={entries} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow?.textContent).toContain(expected.data);

		expect(screen.getByText('Ø upload').nextElementSibling).toHaveTextContent(expected.uploadMean);
		expect(screen.getByText(expected.gpsMean)).toBeInTheDocument();
		expect(screen.getByText(expected.calculatedMean)).toBeInTheDocument();
		expect(screen.getByText('maxSpeed').nextElementSibling).toHaveTextContent(expected.maxSpeed);
		expect(screen.getByText(expected.ascent)).toBeInTheDocument();
		expect(screen.getByText(expected.descent)).toBeInTheDocument();
		expect(screen.getByText('Distance').nextElementSibling).toHaveTextContent(expected.distance);

		// no pause and no eta/eda: no subtables, no extra rows
		expect(screen.queryAllByText('w/o Pause')).toHaveLength(0);
		expect(screen.queryByText('EDA')).not.toBeInTheDocument();
		expect(screen.queryByText('ETA')).not.toBeInTheDocument();
	});

	it('splits speed and distance into with/without pause and counts ignored entries', () => {
		const { entries, expected } = statusWithPauseAndIgnoredEntry;
		render(<Status entries={entries} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow?.textContent).toContain(expected.data);

		expect(screen.queryByText('Ø upload')).not.toBeInTheDocument();
		expect(screen.getByText(expected.gpsMean)).toBeInTheDocument();
		expect(screen.getByText('maxSpeed').nextElementSibling).toHaveTextContent(expected.maxSpeed);

		for (const [label, values] of [['Ø speed', expected.calculatedMean], ['Distance', expected.distance]] as const) {
			const row = screen.getByText(label).closest('tr')!;
			expect(within(row).getByText('Total')).toBeInTheDocument();
			expect(within(row).getByText('w/o Pause')).toBeInTheDocument();
			const cells = within(row).getByRole('table').querySelectorAll('td');
			expect(Array.from(cells, cell => cell.textContent)).toEqual([values.total, values.withoutPause]);
		}

		expect(screen.getByText('EDA').nextElementSibling).toHaveTextContent(expected.eda);
		expect(screen.getByText('ETA').nextElementSibling).toHaveTextContent(expected.eta);
	});

	it('collapses via the imperative ref handle', () => {
		const ref = React.createRef<{ collapseTable: () => void }>();
		const { container } = render(<Status entries={statusWithoutPauses.entries} ref={ref} />);

		const wrapper = container.querySelector('.wrapper');
		expect(wrapper?.className).not.toContain('collapse');

		act(() => ref.current?.collapseTable());
		expect(container.querySelector('.wrapper')?.className).toContain('collapse');
	});
});

/** Real showIgnored state behind the ActionContext for the status toggle. */
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
		const { container } = render(<StatusWithToggle entries={statusWithPauseAndIgnoredEntry.entries} />);

		const dataRow = screen.getByText('data').closest('tr');
		expect(dataRow).not.toHaveClass('showIgnored');
		expect(container.querySelector('.visibleCount')?.textContent).toBe('2');
		expect(container.querySelector('.ignoredCount')).toHaveClass('strike');
		expect(dataRow?.textContent).toContain('2(1)');
	});

	it('toggles the showIgnored state when the data button is clicked', async () => {
		const user = userEvent.setup();
		render(<StatusWithToggle entries={statusWithPauseAndIgnoredEntry.entries} />);

		const dataRow = screen.getByText('data').closest('tr')!;
		const toggle = screen.getByRole('button', { name: 'Show ignored entries on the map' });
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
		await user.click(toggle);
		expect(dataRow).toHaveClass('showIgnored');
		expect(toggle).toHaveAttribute('aria-pressed', 'true');

		await user.click(toggle);
		expect(dataRow).not.toHaveClass('showIgnored');
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
	});

	it('can be reached with Tab and toggled with Enter and Space', async () => {
		const user = userEvent.setup();
		render(<StatusWithToggle entries={statusWithPauseAndIgnoredEntry.entries} />);
		const toggle = screen.getByRole('button', { name: 'Show ignored entries on the map' });

		await user.tab();
		expect(toggle).toHaveFocus();
		await user.keyboard('{Enter}');
		expect(toggle).toHaveAttribute('aria-pressed', 'true');
		await user.keyboard(' ');
		expect(toggle).toHaveAttribute('aria-pressed', 'false');
	});

	it('does not crash when rendered without an action context', async () => {
		const user = userEvent.setup();
		render(<Status entries={statusWithPauseAndIgnoredEntry.entries} ref={React.createRef()} />);

		const dataRow = screen.getByText('data').closest('tr')!;
		await user.click(screen.getByRole('button', { name: 'Show ignored entries on the map' }));
		expect(dataRow).not.toHaveClass('showIgnored');
	});
});
