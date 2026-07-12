import React, { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { useGetData } from '../hooks/useData';
import { getIndex } from '../pages/Start';
import { makeEntry, realLogin, StatefulContext } from './testUtils';

// The core polling data flow: getIndex derives the next fetch index from the
// current entries, useGetData fetches it and merges the response by replacing
// the previous last entry (which may have been recalculated server-side).

describe('getIndex', () => {
	it('starts at 0 without entries', () => {
		expect(getIndex([])).toBe(0);
	});

	it('continues after the last entry of the same day', () => {
		const createdToday = Date.now();
		const entries = [makeEntry({ index: 4, time: { created: createdToday, recieved: createdToday, uploadDuration: 0.5, diff: 30, createdString: '12:00' } })];

		expect(getIndex(entries)).toBe(5);
	});

	it('resets to 0 when the last entry is from a previous day', () => {
		const createdYesterday = Date.now() - 24 * 60 * 60 * 1000;
		const entries = [makeEntry({ index: 4, time: { created: createdYesterday, recieved: createdYesterday, uploadDuration: 0.5, diff: 30, createdString: '12:00' } })];

		expect(getIndex(entries)).toBe(0);
	});
});

/** Mirrors Start: index derived from the current entries via getIndex. */
function FetchHarness() {
	const [entries, setEntries] = useState<Models.IEntry[]>([]);
	const [status, setStatus] = useState('-');
	const index = getIndex(entries);
	const { fetchData } = useGetData(index, 55000, setEntries);

	const runFetch = async () => {
		const result = await fetchData();
		setStatus(String(result.status));
	};

	return (
		<>
			<button onClick={() => void runFetch()}>fetch</button>
			<span data-testid="status">{status}</span>
			<span data-testid="count">{String(entries.length)}</span>
		</>
	);
}

describe('useGetData without a login', () => {
	it('rejects the fetch and logs the user out', async () => {
		const user = userEvent.setup();
		render(<StatefulContext initialLoggedIn={true} probe={true}><FetchHarness /></StatefulContext>);

		await user.click(screen.getByText('fetch'));

		await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('403'));
		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');
		expect(screen.getByTestId('count')).toHaveTextContent(/^0$/);
	});
});

describe('useGetData merge (E2E against the real dev server)', () => {
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

	it('a repeated fetch merges the tail without duplicating entries', async () => {
		const user = userEvent.setup();
		const expectedCount = new RegExp(`^${serverEntries.length}$`);
		render(<StatefulContext initialLoggedIn={true}><FetchHarness /></StatefulContext>);

		// first fetch: index 0, loads the full list
		await user.click(screen.getByText('fetch'));
		await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent(expectedCount));

		// second fetch: index derived from the last entry, refetches only the tail
		// and replaces the previous last entry - the count must not change
		await user.click(screen.getByText('fetch'));
		await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^200$/));
		expect(screen.getByTestId('count')).toHaveTextContent(expectedCount);
	});
});
