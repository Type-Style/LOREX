import React, { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useGetData } from '../hooks/useData';
import { getIndex } from '../pages/Start';
import { makeEntry, StatefulContext } from './testUtils';

describe('getIndex', () => {
	it('starts at 0 without entries', () => {
		expect(getIndex([])).toBe(0);
	});

	it('continues after the last entry index, not the entry count', () => {
		const createdToday = Date.now();
		const entries = [makeEntry({ index: 2 }), makeEntry({ index: 4, time: { created: createdToday, recieved: createdToday, uploadDuration: 0.5, diff: 30, createdString: '12:00' } })];

		expect(getIndex(entries)).toBe(5);
	});

	it('resets to 0 when the last entry is from a previous day', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		const createdYesterday = yesterday.getTime();
		const entries = [makeEntry({ index: 4, time: { created: createdYesterday, recieved: createdYesterday, uploadDuration: 0.5, diff: 30, createdString: '12:00' } })];

		expect(getIndex(entries)).toBe(0);
	});
});

function Fetch({ initialEntries }: { initialEntries: Models.IEntry[] }) {
	const [entries, setEntries] = useState(initialEntries);
	const [result, setResult] = useState<client.entryData | null>(null);
	const index = getIndex(entries);
	const { fetchData } = useGetData(index, 55000, setEntries);

	const runFetch = async () => {
		setResult(null);
		setResult(await fetchData());
	};

	return (
		<>
			<button onClick={() => void runFetch()}>fetch</button>
			<span data-testid="result">{result ? JSON.stringify(result) : 'pending'}</span>
			<span data-testid="entries">{JSON.stringify(entries)}</span>
		</>
	);
}

describe('useGetData without a login', () => {
	beforeEach(() => {
		localStorage.removeItem('jwt');
	});

	it.each(['empty', 'populated'])('rejects the fetch, logs out and preserves %s entries', async (state) => {
		const entries = state === 'empty' ? [] : [makeEntry({ index: 4 })];
		const user = userEvent.setup();
		render(<StatefulContext initialLoggedIn={true} probe={true}><Fetch initialEntries={entries} /></StatefulContext>);

		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent(/^true$/);
		expect(screen.getByTestId('result')).toHaveTextContent(/^pending$/);

		await user.click(screen.getByRole('button', { name: 'fetch' }));

		await waitFor(() => expect(screen.getByTestId('result').textContent).toBe(JSON.stringify({
			isError: true,
			status: 403,
			message: 'No valid login',
			fetchTimeData: { last: null, next: null },
		})));
		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent(/^false$/);
		expect(JSON.parse(screen.getByTestId('entries').textContent!)).toEqual(entries);
	});
});
