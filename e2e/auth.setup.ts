import { expect, test as setup } from '@playwright/test';
import { authStatePath } from './helpers';

setup('authenticate and persist storage state', async ({ page }) => {
	await page.goto('/login');
	await page.getByLabel('Username').fill('TEST');
	await page.getByLabel('Password').fill('test');
	await page.getByRole('button', { name: 'Login' }).click();

	await expect(page.getByText('Logged In')).toBeVisible();
	expect(await page.evaluate(() => localStorage.getItem('jwt'))).toBeTruthy();

	const read = page.waitForResponse(res => new URL(res.url()).pathname === '/read');
	await page.reload();
	expect((await read).ok()).toBeTruthy();
	await expect(page.getByText('Logged In')).toBeVisible();
	expect(await page.evaluate(() => localStorage.getItem('jwt'))).toBeTruthy();

	await page.context().storageState({ path: authStatePath });
});
