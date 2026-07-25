import { expect, test } from '@playwright/test';
import { uiLogin } from './helpers';

// Logout wiring (Start.tsx:104): the logged-in button clears the JWT from
// localStorage and flips the UI back to the logged-out link. Read-only - it
// never writes an entry, so it is safe in any position/order.
test('logging out clears the stored jwt and shows the logged-out state', async ({ page }) => {
	await uiLogin(page);

	const jwtAfterLogin = await page.evaluate(() => localStorage.getItem('jwt'));
	expect(jwtAfterLogin, 'login must have stored a jwt').toBeTruthy();

	await page.getByText('Logged In').click();

	await expect(page.getByText('Logged Out')).toBeVisible();
	const jwtAfterLogout = await page.evaluate(() => localStorage.getItem('jwt'));
	expect(jwtAfterLogout, 'logout must clear the jwt').toBeNull();
});
