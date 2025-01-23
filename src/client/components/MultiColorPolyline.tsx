import React, { useState } from "react";
import { parse, Oklch, toGamut, formatCss } from "culori";
import { Polyline } from "react-leaflet";
import { getMaxSpeed } from "../scripts/maxSpeed";

export const MultiColorPolyline = ({ cleanEntries }: { cleanEntries: Models.IEntry[]; }) => {
	const [useRelativeColors] = useState<boolean>(true); // TODO Change candidate; Use color in range to maximum speed, like from 0 to max, rather than fixed range
	let maxSpeed = 0;
	const startColor = parse('oklch(62.8% 0.2577 10)') as Oklch;
	const calculateHue = (currentSpeed, maxSpeed, calcSpeed) => {
		let speed = currentSpeed;0
		if (calcSpeed > currentSpeed) {
			speed = 2 * (currentSpeed * calcSpeed) / (currentSpeed + calcSpeed); // Harmonic Mean
		}
		const hue = (speed / maxSpeed) * 200;

		return hue;
	};

	const calculateLightness = (hue: number) => {
		const baseLightness = 60;
		if (hue > 30) { // max 200
			const lightness = (baseLightness + ((hue - 30) / (200 - 30)) * (100 - baseLightness)) / 100;
			return lightness;
		} else {
			return baseLightness / 100;
		}
	};

	if (useRelativeColors) {
		maxSpeed = getMaxSpeed(cleanEntries);
	}

	return cleanEntries.map((entry, index) => {
		if (!index || entry.time.diff > 300) { return false; }

		const previousEntry = cleanEntries[index - 1];
		const color = structuredClone(startColor);
		const currentSpeed = entry.speed.gps * 3.6; // convert to km/h
		const calcSpeed = entry.speed.horizontal * 3.6;

		color.h = calculateHue(currentSpeed, maxSpeed, calcSpeed);
		color.l = calculateLightness(color.h);

		const correctedColor = toGamut('rgb', 'oklch', null)(color); // map OKLCH to the RGB gamut

		let strokeDashArray = null;

		if (entry.time.diff > 100 || entry.time.diff < 25) { strokeDashArray = "4 8"; }
		return (<Polyline
			key={entry.time.created * 1.1 + Math.random()} // random to force rerender while new data is incoming (maxSpeed might have changed)
			positions={[[previousEntry.lat, previousEntry.lon], [entry.lat, entry.lon]]}
			color={formatCss(correctedColor)}
			weight={5}
			dashArray={strokeDashArray}
			lineCap={"butt"} />);
	});

};
