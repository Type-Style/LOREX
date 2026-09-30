import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import { extendTheme, ThemeProvider } from '@mui/material/styles';
import axios from 'axios';
import { Context } from '../context';

// Dev-only credentials: the login controller only accepts the TEST user
// outside production (see src/controller/login.ts and productionGuard.test.ts).
export const TEST_USER = 'TEST';
export const TEST_PASSWORD = 'test';

// Read-only component fixtures need context setters but do not update shared state.
const ignoreStateUpdate = () => {};

/** Mirrors the effective theme of the real app entry (src/client/index.tsx) - keep in sync. */
export const testTheme = extendTheme({
	typography: {
		fontFamily: 'Science-Gothic, sans-serif',
		fontSize: 20,
	},
});

export const makeContext = (overrides: Partial<client.AppContext> = {}): client.AppContext => ({
	isLoggedIn: false,
	setLogin: ignoreStateUpdate,
	userInfo: false,
	setUserInfo: ignoreStateUpdate,
	mode: 'light',
	setMode: ignoreStateUpdate,
	prefersDarkMode: false,
	mapToken: null,
	trafficToken: null,
	...overrides,
});

export function renderWithContext(ui: React.ReactElement, contextObj: client.AppContext = makeContext()) {
	return render(
		<ThemeProvider theme={testTheme}>
			<Context value={[contextObj]}>{ui}</Context>
		</ThemeProvider>
	);
}

/** Real csrf request against the running dev server, mirrors what pages/Login.tsx sends. */
export async function fetchCsrfToken(): Promise<string> {
	const response = await axios.post<string>('/login/csrf', undefined, {
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			'x-requested-with': 'XMLHttpRequest',
		},
	});

	return response.data;
}

/**
 * Performs a real login against the running dev server (csrf + credentials)
 * and returns the JWT. No mocking; uses the dev-only TEST account.
 */
export async function realLogin(): Promise<string> {
	const csrfToken = await fetchCsrfToken();

	const body = new URLSearchParams({ user: TEST_USER, password: TEST_PASSWORD, csrfToken }).toString();
	const response = await axios.post<{ token: string }>('/login', body, {
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
	});

	return response.data.token;
}

/**
 * Stateful context provider: real useState behind the context so a page's
 * setLogin/setUserInfo calls actually work. With `probe`, the login state is
 * additionally observable through a data-testid="isLoggedIn" span.
 */
export function StatefulContext({ initialLoggedIn = false, initialUserInfo = false, probe = false, children }: {
	initialLoggedIn?: boolean,
	initialUserInfo?: false | { user: string, exp: number },
	probe?: boolean,
	children: React.ReactNode
}) {
	const [isLoggedIn, setLogin] = useState(initialLoggedIn);
	const [userInfo, setUserInfo] = useState<false | { user: string; exp: number }>(initialUserInfo);

	const contextObj = makeContext({ isLoggedIn, setLogin, userInfo, setUserInfo });

	return (
		<ThemeProvider theme={testTheme}>
			<Context value={[contextObj]}>
				{probe && <span data-testid="isLoggedIn">{String(isLoggedIn)}</span>}
				{children}
			</Context>
		</ThemeProvider>
	);
}

// Find the button containing the mode label; jsdom cannot resolve its responsive visibility.
// Playwright checks the visible control and resulting theme on desktop and mobile.
export function getModeButton(mode: string): HTMLButtonElement {
	const button = screen.getByText(mode).closest('button');
	if (!button) { throw new Error(`no button wraps the mode label "${mode}"`); }
	return button;
}

/** Unsigned JWT with a real base64 payload; enough for client-side parsing (convertJwt). */
export function makeFakeJwt(payload: Record<string, unknown>): string {
	const base64 = (obj: Record<string, unknown>) => window.btoa(JSON.stringify(obj));
	return `${base64({ alg: 'HS256', typ: 'JWT' })}.${base64(payload)}.invalid-signature`;
}

export const makeEntry = (overrides: Partial<Models.IEntry> = {}): Models.IEntry => ({
	altitude: 100,
	hdop: 1,
	heading: 90,
	index: 0,
	lat: 50,
	lon: 8,
	user: TEST_USER,
	ignore: false,
	time: { created: Date.now(), recieved: Date.now(), uploadDuration: 0.5, diff: 30, createdString: '12:00' },
	angle: 45,
	distance: { horizontal: 0, vertical: 0, total: 0 },
	speed: { gps: 0, horizontal: 0, vertical: 0, total: 0, maxSpeed: { value: 100, warning: false, alert: false } },
	address: 'Test Street, Test Town',
	...overrides,
});
