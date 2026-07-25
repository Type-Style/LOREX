import { expect, test } from '@playwright/test';
import { seedIfEmpty, uiLogin } from './helpers';

// Tab switching inside an open popup (PopupContent.tsx): clicking a tab renders
// that tab's content and syncs ?tab=<name> into the URL (usePopup.updateUrlParams,
// via history.replaceState). Deep-links the latest marker's popup so the tabs are
// present; seeds one entry when the day is still empty so it also runs standalone.
test('switching popup tabs renders their content and syncs the tab into the url', async ({ page, request }) => {
	await uiLogin(page);

	const entries = await seedIfEmpty(page, request);
	const lastIndex = entries[entries.length - 1].index;

	await page.goto(`/?popup=${lastIndex}`);
	await expect(page.getByRole('tab', { name: 'speed' })).toBeVisible();

	await page.getByRole('tab', { name: 'speed' }).click();
	await expect(page.getByText('GPS', { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/tab=speed/);

	await page.getByRole('tab', { name: 'time' }).click();
	await expect(page.getByText('Created', { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/tab=time/);
});
