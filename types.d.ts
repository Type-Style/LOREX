
/* eslint-disable @typescript-eslint/no-unused-vars */

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
		angle: number,

		/**
		* object containing horizontal vertical and total distance, in meters
		*/
		distance: {
			horizontal: number,
			vertical: number,
			total: number
		},

		/**
		* object containing horizontal vertical and total speed, in km/h
		*/
		speed: {
			gps: number;
			horizontal: number,
			vertical: number,
			total: number
		},

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
		time: {
			created: number,
			recieved: number,
			uploadDuration: number,
			diff: number
			createdString: string
		},

		/**
		* user as recieved
		*/
		user: string
	}
}
