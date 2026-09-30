import { expect, test } from '@playwright/test';

// Basic smoke: the application is served, React mounts and both pages render.
test('start page loads and shows the logged-out state', async ({ page, isMobile }) => {
	await page.goto('/');

	await expect(page).toHaveTitle(/LOREX/);
	await expect(page.getByText('Logged Out')).toBeVisible();
	await expect(page.getByText('No Login')).toBeAttached();
	if (!isMobile) { await expect(page.getByText('No Login')).toBeVisible(); }
});

test('login page renders a usable form', async ({ page }) => {
	await page.goto('/login');

	await expect(page.getByLabel('Username')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Login' })).toBeDisabled();
});


test('the mode switcher flips the color scheme', async ({ page, isMobile }) => {
	await page.goto('/');
	const html = page.locator('html');

	await expect(html).toHaveAttribute('data-mui-color-scheme', 'light');
	const surface = page.locator('.start');
	const lightColor = await surface.evaluate(element => getComputedStyle(element).color);
	const lightBackground = await surface.evaluate(element => getComputedStyle(element).backgroundColor);

	const control = isMobile ? page.locator('.theme button > span').first() : page.getByRole('button', { name: 'light', exact: true });
	await control.click();

	await expect(html).toHaveAttribute('data-mui-color-scheme', 'dark');
	await expect(page.locator('.theme button')).toHaveText('dark');
	await expect.poll(() => surface.evaluate(element => getComputedStyle(element).color)).not.toBe(lightColor);
	await expect.poll(() => surface.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);
	await (isMobile ? control : page.getByRole('button', { name: 'dark', exact: true })).click();
	await expect(html).toHaveAttribute('data-mui-color-scheme', 'light');
	await expect.poll(() => surface.evaluate(element => getComputedStyle(element).color)).toBe(lightColor);
	await expect.poll(() => surface.evaluate(element => getComputedStyle(element).backgroundColor)).toBe(lightBackground);
});
