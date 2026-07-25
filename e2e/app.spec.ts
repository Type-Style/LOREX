import { expect, test } from '@playwright/test';

// Basic smoke: the application is served, React mounts and both pages render.
test('start page loads and shows the logged-out state', async ({ page }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/LOREX/);
	await expect(page.getByText('Logged Out')).toBeVisible();
	await expect(page.getByText('No Login')).toBeVisible();
});

test('login page renders a usable form', async ({ page }) => {
	await page.goto('/login');

	await expect(page.getByLabel('Username')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
});

// In a real browser the viewport is wide enough that the mode button is visible
// (unlike jsdom, see src/client/tests/testUtils.tsx getModeButton).
test('the mode switcher flips the color scheme', async ({ page }) => {
	await page.goto('/');
	const html = page.locator('html');

	await expect(html).toHaveAttribute('data-mui-color-scheme', 'light');

	await page.getByRole('button', { name: 'light' }).click();

	await expect(html).toHaveAttribute('data-mui-color-scheme', 'dark');
});
