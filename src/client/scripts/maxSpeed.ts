export const getMaxSpeed = function (cleanEntries:Models.IEntry[]) {
	let maxSpeed = cleanEntries.reduce((maxSpeed, entry:Models.IEntry) => {
		// compare the current entry's GPS speed with the maxSpeed found so far
		return Math.max(maxSpeed, entry.speed.gps);
	}, cleanEntries[0].speed.gps);
	return maxSpeed *= 3.6; // convert M/S to KM/h	
};

export const exceed = function (entry:Models.IEntry) {
	if (!entry.speed.maxSpeed) { return false; }
	return	entry.speed.maxSpeed < (3.6 * Math.max(entry.speed.gps, entry.speed.total ?? 0));
};