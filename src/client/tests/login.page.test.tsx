import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../pages/Login';
import { convertJwt } from '../scripts/convertJwt';
import { fetchCsrfToken, StatefulContext, TEST_PASSWORD, TEST_USER } from './testUtils';

// Real requests: jsdom resolves relative URLs against http://localhost/ (the running dev server).
describe('dev server connectivity (real HTTP from jsdom)', () => {
	it('provides a csrf token', async () => {
		const csrfToken = await fetchCsrfToken();

		expect(csrfToken).toMatch(/^[a-f0-9]{32}$/);
	});
});

/**
 * The login page inside the shared stateful context plus a "/" sentinel
 * route to observe the post-login redirect.
 */
function LoginHarness({ initialUserInfo = false }: { initialUserInfo?: false | { user: string; exp: number } }) {
	return (
		<StatefulContext initialUserInfo={initialUserInfo} probe={true}>
			<MemoryRouter initialEntries={['/login']}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/" element={<div>start-sentinel</div>} />
				</Routes>
			</MemoryRouter>
		</StatefulContext>
	);
}

describe('Login page (E2E against the real dev server)', () => {
	afterEach(() => {
		localStorage.removeItem('jwt');
	});

	it('validates fields on blur and only enables submit once the form is valid', async () => {
		const user = userEvent.setup();
		render(<LoginHarness />);

		const username = screen.getByLabelText(/Username/);
		const password = screen.getByLabelText(/Password/);
		const submit = screen.getByRole('button', { name: /login/i });

		expect(submit).toBeDisabled(); // empty form

		await user.type(username, 'a');
		await user.tab(); // blur adds the error state
		expect(screen.getByText('Minimum 2')).toBeInTheDocument();
		expect(submit).toBeDisabled();

		await user.type(password, 'b');
		await user.tab();
		expect(screen.getByText('Enter Password')).toBeInTheDocument();
		expect(submit).toBeDisabled();

		await user.type(username, 'ab'); // typing again clears the error state
		await user.type(password, 'cd');
		expect(screen.queryByText('Minimum 2')).not.toBeInTheDocument();
		expect(screen.queryByText('Enter Password')).not.toBeInTheDocument();
		expect(submit).toBeEnabled();
	});

	it('pre-fills the username from prior session info and focuses the password field', () => {
		render(<LoginHarness initialUserInfo={{ user: TEST_USER, exp: 0 }} />);

		expect(screen.getByLabelText(/Username/)).toHaveValue(TEST_USER);
		expect(screen.getByLabelText(/Password/)).toHaveFocus();
	});

	it('shows the real server error for invalid credentials and resets loading', async () => {
		const user = userEvent.setup();
		render(<LoginHarness />);

		await user.type(screen.getByLabelText(/Username/), 'user');
		await user.type(screen.getByLabelText(/Password/), 'pass');

		const submit = screen.getByRole('button', { name: /login/i });
		await user.click(submit);

		expect(submit).toBeDisabled(); // isLoading until the server answers (bcrypt takes a moment)

		expect(await screen.findByText(/Invalid credentials/, {}, { timeout: 20000 })).toBeInTheDocument();
		expect(screen.getByText('403')).toBeInTheDocument();
		expect(localStorage.getItem('jwt')).toBeNull();
		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('false');

		await waitFor(() => expect(submit).toBeEnabled()); // loading reset, retry possible
	});

	it('logs in with the dev TEST user, stores the JWT and redirects to /', async () => {
		const user = userEvent.setup();
		render(<LoginHarness />);

		await user.type(screen.getByLabelText(/Username/), TEST_USER);
		await user.type(screen.getByLabelText(/Password/), TEST_PASSWORD);
		await user.click(screen.getByRole('button', { name: /login/i }));

		expect(await screen.findByText('Success!', {}, { timeout: 20000 })).toBeInTheDocument();

		const jwt = localStorage.getItem('jwt') ?? '';
		const segments = jwt.split('.');
		expect(segments).toHaveLength(3);
		// the app's own parser reads the stored token, no need to hand-roll decoding
		expect(convertJwt()).toMatchObject({ user: TEST_USER });

		expect(screen.getByTestId('isLoggedIn')).toHaveTextContent('true');

		// redirect() navigates after a 1s delay
		expect(await screen.findByText('start-sentinel')).toBeInTheDocument();
	});
});
