import { expect, test } from '@playwright/test';
import { openEntries, seedIfEmpty, seedKnownEntries, uiLogin } from './helpers';

test('subinfo shows actual latest GPS, available address and deterministic age/fetch timing', async ({ page, request }, testInfo) => {
	await uiLogin(page);
	const entries = await seedIfEmpty(page, request);
	let latest = entries.at(-1)!;
	if (!latest.address) {
		// One real road-coordinate write, not retries against the external geocoder.
		[latest] = await seedKnownEntries(page, request, [{ lat: 50, lon: 8, timestamp: Date.now() - 60000 }]);
	}
	const now = Math.max(latest.time.created, latest.time.recieved) + 120000;
	await page.clock.setFixedTime(now);
	const entry = (await openEntries(page)).at(-1)!;
	expect(entry.index).toBe(latest.index);
	const subinfo = page.locator('.subinfo');
	await expect(subinfo.getByText('GPS:', { exact: true })).toBeVisible();
	await expect(subinfo.locator('a.info')).toHaveText(`${entry.lat} / ${entry.lon}`);
	const seconds = Math.floor((now - entry.time.created) / 1000);
	const minutes = Math.round(seconds / 60);
	const hours = Math.round(seconds / 3600);
	const days = Math.round(seconds / 86400);
	const months = Math.round(seconds / 2592000);
	const [count, unit] = minutes < 60 ? [minutes, 'minute'] : hours < 24 ? [hours, 'hour']
		: days < 30 ? [days, 'day'] : months < 12 ? [months, 'month'] : [Math.round(seconds / 31536000), 'year'];
	await expect(subinfo.locator('span.info').last()).toHaveText(`${count} ${unit}${count === 1 ? '' : 's'} ago`);
	if (entry.address) {
		await expect(subinfo.locator('span.info')).toHaveCount(2);
		await expect(subinfo.locator('span.info').first()).toHaveText(entry.address);
		await expect(subinfo.locator('span.info').first()).toBeVisible();
	} else {
		await expect(subinfo.locator('span.info')).toHaveCount(1);
		const description = 'Latest entry has no address after one road-coordinate write; address rendering was NOT exercised. Cover deterministically in the component suite.';
		testInfo.annotations.push({ type: 'address-coverage-gap', description });
		console.warn(description);
	}
	const progress = subinfo.getByRole('progressbar');
	await expect(progress).toBeVisible();
	await expect(progress).toHaveAttribute('aria-valuenow', '0');
	await page.clock.setFixedTime(now + 27500);
	await expect(progress).toHaveAttribute('aria-valuenow', '50');
});
