
/* eslint-disable @typescript-eslint/no-unused-vars */

type NumericRange<START extends number, END extends number, ARR extends unknown[] = [], ACC extends number = never> = 
  ARR['length'] extends END ? ACC | START | END : 
  NumericRange<START, END, [...ARR, 1], ARR[START] extends undefined ? ACC : ACC | ARR['length']>;

namespace Response {
	interface Message {
		message: string;
		data?: string|JSON;
	}

	interface Error extends Response.Message {
		stack?: string,
		name?: string
	}
}
namespace Models {
	interface IEntry {
		/**
		* height above ground in meters, as received by gps
		*/
		altitude: number,

		/**
		* Direction in degrees between two coordinate pairs: 0°-360°
		*/
		angle: NumericRange<0, 360>,

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
		speeed: {
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
		heading: NumericRange<0, 360>,

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
