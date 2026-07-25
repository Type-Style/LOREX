import React from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@mui/material/styles';
import App, { loginDefault } from '../components/App';
import { getModeButton, testTheme } from './testUtils';

// Mirrors src/client/index.tsx: App inside a css-variables ThemeProvider.
// With an empty localStorage the app is deterministically logged out and the
// router (created against jsdom's http://localhost/) renders Start at "/".

function renderApp() {
	return render(
		<ThemeProvider theme={testTheme}>
			<App />
		</ThemeProvider>
	);
}

describe('loginDefault', () => {
	it('derives the initial login state from the token expiry', () => {
		const nowInSeconds = Date.now() / 1000;

		expect(loginDefault(false)).toBe(false); // no jwt in storage
		expect(loginDefault({ user: 'TEST', exp: nowInSeconds + 3600 })).toBe(true);
		expect(loginDefault({ user: 'TEST', exp: nowInSeconds - 3600 })).toBe(false);
	});
});

describe('App', () => {
	beforeEach(() => {
		localStorage.clear();
		delete document.documentElement.dataset.muiColorScheme;
	});

	it('renders the Start page on "/" in the logged-out state', async () => {
		renderApp();

		expect(await screen.findByText('Logged Out')).toBeInTheDocument();
		expect(screen.getByText('No Login')).toBeInTheDocument();
	});

	it('patches the mui color scheme attribute onto the document element', async () => {
		renderApp();

		await waitFor(() => expect(document.documentElement.dataset.muiColorScheme).toBe('light'));
	});

	it('switches the color scheme through the ModeSwitcher', async () => {
		const user = userEvent.setup();
		renderApp();

		await screen.findByText('light'); // wait for useColorScheme to settle
		await user.click(getModeButton('light'));

		expect(getModeButton('dark')).toBeInTheDocument();
		await waitFor(() => expect(document.documentElement.dataset.muiColorScheme).toBe('dark'));
	});
});
