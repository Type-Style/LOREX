export function getSpeed(speed: number, entry?: Models.IEntry): Models.ISpeed {
	const gps = speed;
	let horizontal;
	let vertical;
	let total;

	if (entry) {
		horizontal = entry.distance.horizontal / entry.time.diff;
		vertical = entry.distance.vertical / entry.time.diff;
		total = entry.distance.total / entry.time.diff;
	}

	return {
		gps: gps,
		horizontal: horizontal,
		vertical: vertical,
		total: total
	}
}