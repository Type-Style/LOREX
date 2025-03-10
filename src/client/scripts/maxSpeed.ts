export const getMaxSpeed = function (cleanEntries: Models.IEntry[]) {
	let maxSpeed = cleanEntries.reduce((maxSpeed, entry: Models.IEntry) => {
		// compare the current entry's GPS speed with the maxSpeed found so far
		return Math.max(maxSpeed, entry.speed.gps);
	}, cleanEntries[0].speed.gps);
	return maxSpeed *= 3.6; // convert M/S to KM/h	
};

export const exceed = function (entry: Models.IEntry) {
	if (!entry.speed.maxSpeed) { return false; }
	let compareSpeed:number;
	const currentSpeed = entry.speed.gps * 3.6;
	const calcSpeed = entry.speed.total ? entry.speed.total * 3.6 : null;

	let harmonicMean:number = calcSpeed ? 2 * (currentSpeed * calcSpeed) / (currentSpeed + calcSpeed) : 0; // Harmonic Mean;

	compareSpeed = Math.floor(Math.max(currentSpeed, harmonicMean));
	compareSpeed = Math.floor(compareSpeed - entry.hdop);
	
	return compareSpeed > entry.speed.maxSpeed;
};