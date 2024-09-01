export const getMaxSpeed = function (cleanEntries:Models.IEntry[]) {
	let maxSpeed = cleanEntries.reduce((maxSpeed, entry:Models.IEntry) => {
		// compare the current entry's GPS speed with the maxSpeed found so far
		return Math.max(maxSpeed, entry.speed.gps);
	}, cleanEntries[0].speed.gps);
	return maxSpeed *= 3.6; // convert M/S to KM/h	
};