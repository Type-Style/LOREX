import React from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Start from '../pages/Start';
import { convertJwt } from '../scripts/convertJwt';
import { makeFakeJwt, realLogin, StatefulContext, TEST_USER } from './testUtils';

// The Start page fetches from the real dev server (jsdom base url http://localhost/). No mocking.

/** convertJwt() narrowed for the harness prop; fails loudly when the jwt is missing. */
function currentUserInfo(): { user: string, exp: number } {
	const userInfo = convertJwt();
	if (!userInfo) { throw new Error('expected a parsable jwt in localStorage'); }
	return userInfo;
}

describe('Start page logged out', () => {
	it('shows the logged-out state without fetching', () => {
		render(<StatefulContext><Start /></StatefulContext>);

		expect(screen.getByText('Logged Out')).toBeInTheDocument();
		expect(screen.getByText('No Login')).toBeInTheDocument();
		expect(screen.getByText('403')).toBeInTheDocument();
		expect(screen.getByText('No valid login')).toBeInTheDocument();
	});

	it('reports an expired login when stale user info exists', () => {
		const staleUserInfo = { user: TEST_USER, exp: Math.floor(Date.now() / 1000) - 3600 };
		render(<StatefulContext initialUserInfo={staleUserInfo}><Start /></StatefulContext>);

		expect(screen.getByText('Login expired')).toBeInTheDocument();
	});
});

describe('Start page logged in (E2E against the real dev server)', () => {
	let token: string;
	let serverEntries: Models.IEntry[];

	beforeAll(async () => {
		token = await realLogin();
		localStorage.setItem('jwt', token);

		// read the current server state up front so the assertions below
		// stay correct whether or not test data exists today
		const response = await axios.get<Models.IEntries>('/read?index=0', {
			headers: { Authorization: `Bearer ${token}` },
		});
		serverEntries = response.data.entries;
	});

	afterAll(() => {
		localStorage.removeItem('jwt');
	});

	it('fetches real data and renders the matching state', async () => {
		render(<StatefulContext initialLoggedIn={true} initialUserInfo={currentUserInfo()}><Start /></StatefulContext>);

		expect(screen.getByText('Logged In')).toBeInTheDocument();

		// welcome message built from the real JWT
		expect(screen.getByText(TEST_USER)).toBeInTheDocument();
		expect(screen.getByText('Welcome back')).toBeInTheDocument();

		// the expected render is derived from the real server state read in beforeAll
		// (the latest entry is never ignored, so any data at all renders the status table)
		const expected = serverEntries.length ? 'maxSpeed' : 'No Data to be displayed';
		expect(await screen.findByText(expected)).toBeInTheDocument();

		// the successful fetch sets the fetch times, which mounts the LinearBuffer
		// (query its distinct class - lazy-loading CircularProgress fallbacks share the progressbar role)
		await waitFor(() => expect(document.querySelector('.MuiLinearProgress-root')).toBeInTheDocument());
	});

	it('logs out via the button and clears local storage', async () => {
		const user = userEvent.setup();
		render(<StatefulContext initialLoggedIn={true} initialUserInfo={currentUserInfo()}><Start /></StatefulContext>);

		await user.click(screen.getByText('Logged In'));

		expect(screen.getByText('Logged Out')).toBeInTheDocument();
		expect(localStorage.getItem('jwt')).toBeNull();

		localStorage.setItem('jwt', token); // restore for the remaining tests, the click cleared everything
	});
});

describe('Start page with a forged token (real server rejects)', () => {
	afterAll(() => {
		localStorage.removeItem('jwt');
	});

	it('logs out when the server rejects the token', async () => {
		const exp = Math.floor(Date.now() / 1000) + 3600;
		localStorage.setItem('jwt', makeFakeJwt({ user: TEST_USER, exp }));

		render(<StatefulContext initialLoggedIn={true} initialUserInfo={{ user: TEST_USER, exp }}><Start /></StatefulContext>);

		// the real /read request fails, Start calls setLogin(false); a bad signature
		// is always a 401 "Please reLogin" (validateJWT reserves 403 for expiry)
		expect(await screen.findByText('Logged Out')).toBeInTheDocument();
		expect(await screen.findByText('401')).toBeInTheDocument();
		expect(screen.getByText('No Login')).toBeInTheDocument();
	});
});
