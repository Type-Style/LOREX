import { expect, test } from '@playwright/test';
import { seedIfEmpty, uiLogin } from './helpers';

// The logged-in, data-rich UI in a real browser: statistics panel and the
// bottom gps info. Seeds one entry when the day is still empty, so the spec
// also runs standalone against a clean server.
test('the status panel and gps info render for the logged-in user', async ({ page, request }) => {
	await uiLogin(page);

	await seedIfEmpty(page, request);

	// statistics table with computed values; the row-header texts (e.g. "maxSpeed")
	// are hidden by a container query at this panel width, the values stay visible
	await expect(page.locator('.statusTable')).toBeAttached();
	await expect(page.getByText(/km\/h/).first()).toBeVisible();

	// bottom info: the latest entry's coordinates link to openstreetmap
	await expect(page.getByText('GPS:', { exact: true })).toBeVisible();
	// a freshly auto-opened marker popup can add a second .info link - any of them qualifies
	await expect(page.locator('a.info').first()).toHaveAttribute('href', /openstreetmap\.org/);
});
