import axios from "axios";
import logger from "./logger";
import toFixedNumber from "./toFixedNumber";
import path from "path";
let lastGraphhopperRequestTimestamp = 0;

export async function getPath(lastEntry: Models.IEntry, entry: Models.IEntry): Promise<Models.IPath> {
	let returnObj: Models.IPath = {
		hasFetched: false,
		ignore: false,
	};

	if (!checkPreconditions(lastEntry, entry)) {
		returnObj.ignore = true;
		returnObj.ignoreReason = "Preconditions not met";
		return returnObj;
	}

	// fetch data
	const response = await fetchGraphhopper(lastEntry, entry);
	if (!response) { return returnObj; }
	returnObj = {
		hasFetched: response.hasFetched,
		ignore: response.ignore,
		ignoreReason: response.ignoreReason
	};

	if (response.ignore) { return returnObj; }

	if (typeof response.data === "undefined" || !isValidGraphHopperResponse(response.data)) {
		returnObj.ignoreReason = `🦗 Invalid GraphHopper response`;
		logger.error(returnObj.ignoreReason + JSON.stringify(response));
		return returnObj;
	}

	returnObj = {
		...returnObj,
		coordinates: reorderCoordinates(response.data.paths[0].points.coordinates),
		time: toFixedNumber(response.data.paths[0].time, 3),
		distance: toFixedNumber(response.data.paths[0].distance, 3),
		ascend: toFixedNumber(response.data.paths[0].ascend, 3),
		descend: toFixedNumber(response.data.paths[0].descend, 3)
	};

	// check length of data
	if (JSON.stringify(returnObj).length > 100000) {
		logger.error(`🦗 GraphHopper response too big: ${JSON.stringify(returnObj).length}`);
		return { ...returnObj, ignore: true, ignoreReason: `🦗 GraphHopper response too big` };
	}

	return returnObj;
};

async function fetchGraphhopper(lastEntry: Models.IEntry, entry: Models.IEntry): Promise<GraphHopperResponse> {
	let returnData: GraphHopperResponse = {
		hasFetched: false,
		ignore: false,
		ignoreReason: ""
	};

	let graphHopperKey = process.env.GRAPHHOPPER;
	if (!graphHopperKey) {
		returnData.ignore = true;
		returnData.ignoreReason = "🦗 GRAPHHOPPERKEY missing";
	}
	if (lastGraphhopperRequestTimestamp + 4000 > Date.now()) { // do not fetch data too often
		returnData.ignore = true;
		returnData.ignoreReason = "🦗 Graphhopper request throttled";
	}

	if (returnData.ignore) {
		logger.error(returnData.ignoreReason);
		return returnData;
	}

	const url = `https://graphhopper.com/api/1/route?key=${graphHopperKey}`;
	try {
		returnData.hasFetched = true;
		const { data }: { data: GraphHopperData } = await axios.post(url, {
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
				"ferry"
			],
			"profile": "car",
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
		returnData = { ...returnData, data: data};
	} catch (error) {
		returnData.ignore = true;
		if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
			returnData.ignoreReason = ("🦗 Graphhopper request timed out");
		} else if (axios.isAxiosError(error)) {
			returnData.ignoreReason = ("🦗 Graphhopper request failed " + error.message);
		} else {
			returnData.ignoreReason = (`🦗 Graphhopper failed, ${error}`);
		}

		logger.error(returnData.ignoreReason);
		return returnData;
	}

	return returnData;
}

export function isValidGraphHopperResponse(data: any): data is GraphHopperData {
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
	if (!lastEntry || !entry ||
		lastEntry.ignore || entry.ignore ||
		entry.hdop > 6 ||
		!entry.speed.total || typeof entry.distance.vertical !== "number" || !entry.time.diff) { return false }

	let score = 0.5;
	const scoreAdjustmentFactor = 0.1;
	const up = (weight = 1) => score += scoreAdjustmentFactor * weight;
	const down = (weight = 1) => score -= scoreAdjustmentFactor * weight;

	(entry.speed.gps * 3.6 >= 25 || entry.speed.total * 3.6 >= 20) ? up() : down();
	(entry.distance.vertical > 5) ? down() : null;
	(entry.distance.horizontal >= 150 && entry.distance.horizontal <= 2000) ? up(1.5) : down(2);
	(Math.abs(entry.heading - lastEntry.heading) > 10) ? up() : down(2);
	(entry.time.diff > 300) ? down(1.5) : up(0.5);

	// TODO: check if maxSpeed is availabe and if it is exceeded, if yes up the score if not stay the same
	

	return score >= 0.5;
}


export function updateWithPathData(entry: Models.IEntry, pathObject: Models.IPath): void {
	entry.path = pathObject;
	if (!entry.time.diff || !entry.speed.horizontal || !pathObject || pathObject.ignore) { return }

	const pathSpeed = pathObject.distance! / entry.time.diff; // new distance, actually traveled in given time

	// sanity check
	if (entry.speed.horizontal > pathSpeed || // path too short
		pathSpeed > entry.speed.horizontal * 1.5) { // path way to long
		logger.error(`🦗 GraphHopper Path unlikely, index: ${entry.index} pathSpeed: ${pathSpeed}, gpsSpeed: ${entry.speed.gps} calcSpeed: ${entry.speed.horizontal}`);
		entry.path.ignore = true;
		entry.path.ignoreReason = "🦗 GraphHopper Path unlikely";
		return
	}

	entry.distance.path = pathObject.distance;
	entry.time.path = pathObject.time;
	entry.speed.path = pathSpeed;
	entry.path.coordinates = pathObject.coordinates;
}