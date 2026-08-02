import React, { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { ActionContext } from '../context';
import { useIgnoreData } from '../hooks/useData';
import { realLogin, StatefulContext } from './testUtils';

// Real requests against /read and /read/ignore. The ignore recalculation is
// view-only on the server (never written to the data file), so this suite is
// safe to run on any day, in any order.

function IgnoreActions({ entries }: { entries: Models.IEntry[] }) {
	const { ignoreData, resetData } = useIgnoreData();

	return (
		<>
			<button onClick={() => void resetData()}>reset</button>
			<button onClick={() => void ignoreData(0)}>ignore-first</button>
			<span data-testid="count">{String(entries.length)}</span>
			<span data-testid="firstIgnore">{String(entries[0]?.ignore)}</span>
		</>
	);
}

function IgnoreHarness() {
	const [entries, setEntries] = useState<Models.IEntry[]>([]);
	const [showIgnored, setShowIgnored] = useState(false);
	const actionContext: client.ActionContext = { entries, setEntries, showIgnored, setShowIgnored };

	return (
		<StatefulContext initialLoggedIn={true}>
			<ActionContext value={[actionContext]}>
				<IgnoreActions entries={entries} />
			</ActionContext>
		</StatefulContext>
	);
}

describe('useIgnoreData (E2E against the real dev server)', () => {
	let serverEntries: Models.IEntry[];

	beforeAll(async () => {
		const token = await realLogin();
		localStorage.setItem('jwt', token);

		const response = await axios.get<Models.IEntries>('/read?index=0', {
			headers: { Authorization: `Bearer ${token}` },
		});
		serverEntries = response.data.entries;
	});

	afterAll(() => {
		localStorage.removeItem('jwt');
	});

	it('resetData loads the full entry list into the action context', async () => {
		const user = userEvent.setup();
		const expectedCount = String(serverEntries.length);
		render(<IgnoreHarness />);

		await user.click(screen.getByText('reset'));

		await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent(new RegExp(`^${expectedCount}$`)));
	});

	it('ignoreData delivers a set where the requested entry is marked ignored', async () => {
		const user = userEvent.setup();
		// with data the first entry comes back ignore:true, without data the probe stays undefined
		const expectedFirstIgnore = serverEntries.length ? 'true' : 'undefined';
		render(<IgnoreHarness />);

		await user.click(screen.getByText('ignore-first'));

		await waitFor(() => expect(screen.getByTestId('firstIgnore')).toHaveTextContent(expectedFirstIgnore));
	});
});
