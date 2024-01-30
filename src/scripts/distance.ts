export function getDistance(entry: Models.IEntry, lastEntry: Models.IEntry): Models.IDistance {
	const horizontal = calculateDistance({ lat: entry.lat, lon: entry.lon }, { lat: lastEntry.lat, lon: lastEntry.lon });
	const vertical = entry.altitude - lastEntry.altitude;
	const total = Math.sqrt(horizontal * horizontal + vertical * vertical);

	return {
		horizontal: horizontal,
		vertical: vertical,
		total: total
	}
}

function toRad(x: number): number {
	return x * Math.PI / 180;
}

function calculateDistance(coord1: { lat: number, lon: number }, coord2: { lat: number, lon: number }): number {
	const R = 6371000; // radius of the Earth in meters
	const dLat = toRad(coord2.lat - coord1.lat);
	const dLon = toRad(coord2.lon - coord1.lon);

	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	const distance = R * c;

	return distance;
}