
/* eslint-disable @typescript-eslint/no-unused-vars */
namespace RateLimit {
	interface obj {
		[key: string]: {
			limitReachedOnError: boolean,
			time: number
		}
	}
}

namespace Response {
	interface Message {
		message: string;
		data?: string | JSON;
	}

	interface Error extends Response.Message {
		stack?: string,
		name?: string,
		status?: number
	}
}
namespace File {
	interface Obj {
		path: string,
		content?: Models.IEntries | boolean;
	}

	type method = 'read' | 'write';
}

namespace Models {
	interface IEntries {
		entries: IEntry[]
	}

	interface IEntry {
		/**
		* height above ground in meters, as received by gps
		*/
		address: string,

		/**
		* height above ground in meters, as received by gps
		*/
		altitude: number,

		/**
		* Direction in degrees between two coordinate pairs: 0°-360°
		*/
		angle?: number,

		/**
		* object containing horizontal vertical and total distance, in meters
		*/
		distance: Models.IDistance,

		/**
		* object containing horizontal vertical and total speed, in km/h
		*/
		speed: Models.ISpeed,

		/**
		* index, position of the entry point in the chain 
		*/
		index: number,

		/**
		* Heading or Bearing as recieved from gps
		*/
		heading: number,

		/**
		* lat
		*/
		lat: number,


		/**
		* lon
		*/
		lon: number,

		/**
		* hdop: accuracy as recieved by gps
		*/
		hdop: number,

		/**
		* ignore: defined by hdop and time difference; determines whether the view shall display this entry
		*/
		ignore: boolean,


		/**
		* time object containing UNIX timestamps with milliseconds, gps creation time (as recieved via gps), server time (when the server recieved and computed it), differce to last entry (time between waypoints), upload time differnce
		*/
		time: Models.ITime,

		/**
		* user as recieved
		*/
		user: string,

		/**
		* estimated time arrival in unix ms
		*/
		eta?: number,

		/**
		* estimated distance in meters
		*/
		eda?: number,

		/**
		* contains response data from graphhopper,
		* to be used for painting route accurately
		*/
		path?: Models.IPath;
	}

	interface ITime {
		created: number,
		recieved: number,
		uploadDuration: number,
		diff?: number,
		createdString: string,
		path?: number
	}

	interface ISpeed {
		/**
		* speed in m/s recieved by gps
		*/
		gps: number;
		horizontal?: number,
		vertical?: number,
		total?: number,
		/**
		* maximum allowed speed in km/h
		*/
		maxSpeed?: number,
		path?: number
	}
	interface IDistance {
		horizontal: number,
		vertical: number,
		total: number
		path?: number
	}

	interface IPath {
		hasFetched: boolean,
		ignore: boolean,
		ignoreReason?: string,
		coordinates?: number[][],
		time?: number,
		distance?: number,
		ascend?: number,
		descend?: number
	}
}

interface CSRFToken {
	token: string;
	expiry: number;
}

interface HttpError extends Error {
	status?: number;
	statusCode?: number;
}

interface NominatimResponse {
	place_id: number;
	osm_type: 'node' | 'way' | 'relation';
	osm_id: number;
	boundingbox: [string, string, string, string];
	lat: string;
	lon: string;
	display_name: string;
	category?: string;
	type?: string;
	place_rank: number;
	importance: number;
	name: string;
	addresstype: string;
	address: {
		house_number: string;
		road: string;
		neighbourhood: string;
		suburb: string;
		city_district: string;
		city?: string;
		town: string;
		county: string;
		postcode: string;
		country: string;
		country_code: string;
	};
	extratags?: {
		/**
		* maximum allowed speed in km/h
		*/
		maxSpeed?: number;
		[key: string]: string | number | undefined;
	};
}
interface GraphHopperResponse {
	hasFetched: boolean;
	ignore: boolean;
	ignoreReason: string;
	data?: GraphHopperData;
}

interface GraphHopperData {
	paths: GraphHopperPath[]
}

interface GraphHopperPath {
	points: GraphHopperPathCoordinates;
	ascend: number;
	descend: number;
	distance: number;
	time: number;
}

interface GraphHopperPathCoordinates {
	coordinates: number[][];
}

