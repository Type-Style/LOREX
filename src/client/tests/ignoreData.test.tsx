import React, { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionContext } from '../context';
import { useIgnoreData } from '../hooks/useData';
import { makeEntry, StatefulContext } from './testUtils';


function IgnoreActions() {
	const { ignoreData, resetData } = useIgnoreData();
	const [result, setResult] = useState<Omit<client.entryData, 'fetchTimeData'> | null>(null);

	const runFetch = async (action: 'reset' | 'ignore') => {
		setResult(null);
		setResult(await (action === 'reset' ? resetData() : ignoreData(0)));
	};

	return (
		<>
			<button onClick={() => void runFetch('reset')}>reset</button>
			<button onClick={() => void runFetch('ignore')}>ignore</button>
			<span data-testid="result">{result ? JSON.stringify(result) : 'pending'}</span>
		</>
	);
}

function Ignore({ initialEntries }: { initialEntries: Models.IEntry[] }) {
	const [entries, setEntries] = useState(initialEntries);
	const [showIgnored, setShowIgnored] = useState(false);
	const actionContext: client.ActionContext = { entries, setEntries, showIgnored, setShowIgnored };

	return (
		<StatefulContext initialLoggedIn={true} probe={true}>
			<ActionContext value={[actionContext]}>
				<IgnoreActions />
				<span data-testid="entries">{JSON.stringify(entries)}</span>
			</ActionContext>
		</StatefulContext>
	);
}

// These requests reach the real server, but have no token and cannot change its data.
describe('useIgnoreData without a login (real server)', () => {
	beforeEach(() => {
		localStorage.removeItem('jwt');
	});

	it.each(['reset', 'ignore'])('%s reports rejection, logs out and preserves entries', async (action) => {
		const entries = [makeEntry(), makeEntry({ index: 1, ignore: true })];
		const user = userEvent.setup();
		render(<Ignore initialEntries={entries} />);

		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent(/^true$/);
		expect(screen.getByTestId('result')).toHaveTextContent(/^pending$/);

		await user.click(screen.getByRole('button', { name: action }));

		await waitFor(() => expect(screen.getByTestId('result').textContent).toBe(JSON.stringify({
			isError: true,
			status: 401,
			message: 'Please reLogin',
		})));
		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent(/^false$/);
		expect(JSON.parse(screen.getByTestId('entries').textContent!)).toEqual(entries);
	});
});
