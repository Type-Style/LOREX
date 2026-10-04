import { expect, test } from '@playwright/test';
import { ageEntries, closePopups, openEntries, seedKnownEntries, uiLogin } from './helpers';

test('switching same-style basemaps updates tiles and applies then releases local zoom limits', async ({ page, request, isMobile }) => {
	test.setTimeout(90000);
	await uiLogin(page);
	const entries = await seedKnownEntries(page, request, [{ lat: 50, lon: 8 }]);
	await ageEntries(page, entries);
	await openEntries(page);
	await closePopups(page);
	const map = page.locator('.mapContainer');
	const controls = map.locator('.leaflet-control-layers');
	const zoomIn = map.getByRole('button', { name: 'Zoom in', exact: true });
	const zoomOut = map.getByRole('button', { name: 'Zoom out', exact: true });
	const selectLayer = async (name: string) => {
		const option = controls.getByLabel(name, { exact: true });
		if (!await option.isVisible()) {
			// Keyboard activation avoids hover expansion hiding the toggle mid-click.
			await controls.locator('.leaflet-control-layers-toggle').press('Enter');
		}
		await expect(option).toBeEnabled();
		await option.press('Space');
		await expect(option).toBeChecked();
	};
	const expectTiles = async (source: string) => {
		await expect(map.locator(`img.leaflet-tile[src*="${source}"]`).first()).toBeAttached();
		// Leaflet ignores zoom presses until its animation class leaves the map pane.
		await expect(map.locator('.leaflet-map-pane')).not.toHaveClass(/leaflet-zoom-anim/);
	};

	await selectLayer('OSM DE');
	await expectTiles('tile.openstreetmap.de/13/');

	// Leaflet disables Local's radio above zoom 13, so switch at a supported zoom.
	if (isMobile) {
		await selectLayer('Local');
	} else {
		await page.locator('.image[data-name="Local"]').click();
		await expect(controls.getByLabel('Local', { exact: true })).toBeChecked();
	}
	await expect(zoomIn).toHaveAttribute('aria-disabled', 'true');
	await expect(map.locator('img.leaflet-tile[src*="tile.openstreetmap.de/"]')).toHaveCount(0);

	// Same marker style as Local: both limits must still be released.
	await selectLayer('OSM DE');
	await expect(zoomIn).toHaveAttribute('aria-disabled', 'false');
	for (let zoom = 12; zoom >= 7; zoom--) {
		await zoomOut.press('Enter');
		await expectTiles(`tile.openstreetmap.de/${zoom}/`);
	}
	// Retained z8 tiles would satisfy the first zoom-in check before the zoom starts.
	await expect(map.locator('img.leaflet-tile[src*="tile.openstreetmap.de/8/"]')).toHaveCount(0);
	for (let zoom = 8; zoom <= 14; zoom++) {
		await zoomIn.press('Enter');
		await expectTiles(`tile.openstreetmap.de/${zoom}/`);
	}
	await expect(zoomIn).toHaveAttribute('aria-disabled', 'false');
});
