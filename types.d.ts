
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
		content?: Models.IEntries;
	}
}

namespace Models {
	interface IEntries {
		entries: Models.IEntry[]
	}

	interface IEntry {
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
		time: Models.time,

		/**
		* user as recieved
		*/
		user: string
	}

	interface ITime {
		created: number,
		recieved: number,
		uploadDuration: number,
		diff?: number
		createdString: string
	}

	interface ISpeed {
		gps: number;
		horizontal?: number,
		vertical?: number,
		total?: number
	}
	interface IDistance {
		horizontal: number,
		vertical: number,
		total: number
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