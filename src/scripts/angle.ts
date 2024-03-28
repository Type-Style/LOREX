export function getAngle(lastEntry: Models.IEntry, entry: Models.IEntry): number {
	const dLon = (entry.lon - lastEntry.lon) * Math.PI / 180;
	const lat1 = lastEntry.lat * Math.PI / 180;
	const lat2 = entry.lat * Math.PI / 180;
	const y = Math.sin(dLon) * Math.cos(lat2);
	const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
	const angle = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
	return angle;
}