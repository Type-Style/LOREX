import axios from "axios";
import logger from "./logger";
import toFixedNumber from "./toFixedNumber";
let lastGraphhopperRequestTimestamp = 0;

export async function getPath(lastEntry: Models.IEntry, entry: Models.IEntry): Promise<PathObject | "ignore" | null> {
	if (!checkPreconditions(lastEntry, entry)) {
		return "ignore";
	}
	const data = await fetchGraphhopper(lastEntry, entry);

	if (!data) { return null; }

	if (!isValidGraphHopperResponse(data)) {
		logger.error(`🦗 Invalid GraphHopper response: ${JSON.stringify(data)}`);
		return null;
	}

	const returnObj = {
		coordinates: data.paths[0].points.coordinates,
		time: toFixedNumber(data.paths[0].time, 3),
		distance: toFixedNumber(data.paths[0].distance, 3),
		ascend: toFixedNumber(data.paths[0].ascend, 3),
		descend: toFixedNumber(data.paths[0].descend, 3)
	};

	// check length of data
	if (JSON.stringify(returnObj).length > 100000) {
		logger.error(`🦗 GraphHopper response too big: ${JSON.stringify(returnObj).length}`);
		return null;
	}

	returnObj.coordinates = reorderCoordinates(returnObj.coordinates);

	return returnObj;
};

async function fetchGraphhopper(lastEntry: Models.IEntry, entry: Models.IEntry): Promise<GraphHopperResponse | null> {
	let returnData;
	let graphHopperKey = process.env.GRAPHHOPPER;
	if (!graphHopperKey) {
		logger.error("🦗 GRAPHHOPPERKEY missing");
		return null;
	}
	if (lastGraphhopperRequestTimestamp + 4000 > Date.now()) { // do not fetch data too often
		logger.log("🦗 Graphhopper request throttled");
		return null;
	}



	const url = `https://graphhopper.com/api/1/route?key=${graphHopperKey}`;
	try {
		const { data }: { data: GraphHopperResponse } = await axios.post(url, {
			"points": [
				[
					lastEntry.lon,
					lastEntry.lat
				],
				[
					entry.lon,
					entry.lat
				]
			],
			"snap_preventions": [
				"ferry",
			],
			"profile": "small_truck",
			"locale": "de",
			"instructions": false,
			"calc_points": true,
			"points_encoded": false

		}, {
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json"
			}
		})

		lastGraphhopperRequestTimestamp = Date.now();
		returnData = data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
			logger.error("🦗 Graphhopper request timed out");
		} else if (axios.isAxiosError(error)) {
			logger.error("🦗 Graphhopper request failed " + error.message);
		} else {
			logger.error(`🦗 Graphhopper failed, ${error}`);
		}
		return null;
	}

	return returnData;
}

function isValidGraphHopperResponse(data: any): data is GraphHopperResponse {
	return (
		data &&
		Array.isArray(data.paths) &&
		data.paths.length > 0 &&
		data.paths[0].points &&
		Array.isArray(data.paths[0].points.coordinates) &&
		data.paths[0].points.coordinates.length >= 1 && data.paths[0].points.coordinates.length <= 300 &&
		data.paths[0].points.coordinates.every((coordinate: any) => Array.isArray(coordinate) && coordinate.length === 2 && coordinate.every((value: any) => typeof value === 'number')) &&
		typeof data.paths[0].distance === 'number' &&
		typeof data.paths[0].time === 'number' &&
		typeof data.paths[0].ascend === 'number' &&
		typeof data.paths[0].descend === 'number'
	);
}

export function reorderCoordinates(coords: number[][]): number[][] {
	return coords.map(([lon, lat]) => [lat, lon]);
}

export function checkPreconditions(lastEntry: Models.IEntry, entry: Models.IEntry): boolean {
	if (!lastEntry || !entry || lastEntry.ignore || entry.ignore || entry.hdop > 6) { return false; }

	let score = 0.5;
	const scoreAdjustmentFactor = 0.1;
	const up = (weight = 1) => score += scoreAdjustmentFactor * weight;
	const down = (weight = 1) => score -= scoreAdjustmentFactor * weight;

	(entry.speed.gps * 3.6 >= 20) ? up() : down();
	(entry.speed.total) ? (entry.speed.total * 3.6 >= 20) ? up() : down() : down(2);
	(entry.speed.vertical) ? (entry.speed.vertical > 5) ? down() : null : down();
	(entry.distance.horizontal >= 150) ? up(2) : down(2);
	(entry.distance.horizontal >= 2000) ? down(2) : null;
	(Math.abs(entry.heading - lastEntry.heading) > 10) ? up(1.5) : down(2);
	(entry.time.diff && entry.time.diff > 300) ? down(1.5) : up(0.5);

	return score >= 0.5;
}


export function updateWithPathData(entry: Models.IEntry, pathObject: PathObject | "ignore"): void {

	if (!entry.time.diff || !entry.speed.horizontal || !pathObject) { return }
	if (pathObject == "ignore") {
		entry.path = pathObject;
		return
	}

	const pathSpeed = pathObject.distance / entry.time.diff; // new distance, actually traveled in given time

	// sanity check
	if (entry.speed.horizontal > pathSpeed || // path too short
		pathSpeed > entry.speed.horizontal * 1.5) { // path way to long
		logger.error(`🦗 GraphHopper Path unlikely, index: ${entry.index} pathSpeed: ${pathSpeed}, gpsSpeed: ${entry.speed.gps} calcSpeed: ${entry.speed.horizontal}`);
		entry.path = "ignore";
		return
	}

	entry.distance.path = pathObject.distance;
	entry.time.path = pathObject.time;
	entry.speed.path = pathSpeed;
	entry.path = pathObject.coordinates;
}