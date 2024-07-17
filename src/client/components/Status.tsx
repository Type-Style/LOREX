import React from 'react'
//import * as css from "../css/status.module.css";
function getStatusData(entries) {
	const cleanEntries = entries.filter((entry: Models.IEntry) => !entry.ignore);

	function getMean(prop) {
		const props = prop.split('.');
		let divider = 0; // cannot be hardcoded to cleanEntries.length because some properties don't exist on first or last dataPoint
		const value = cleanEntries.reduce((accumulatorValue, current) => {
			// find potentially nested value
			let value = current; // overwritten recursively, start as current
			for (const prop of props) { // iterate over split props (passed as parameter)
				value = value[prop]; // replace current with the next level or finished value
			}

			if (typeof value == "undefined") {
				return accumulatorValue;
			}

			divider++; // keep track of how many entries there are
			return parseFloat(accumulatorValue) + parseFloat(value);

		}, 0) / divider; // now that all values have been added together, devide by amount of them

		//console.log(prop + ": " + value + " divider: " + divider);
		return value;
	}

	const ignoredEntries = entries.length - cleanEntries.length;
	const uploadMean = getMean("time.uploadDuration").toFixed(3);
	const speedGPSMean = (getMean("speed.gps") * 3.6).toFixed(1);
	const speedCalcMean = (getMean("speed.horizontal") * 3.6).toFixed(1);

	return {
		ignoredEntries,
		uploadMean,
		speedGPSMean,
		speedCalcMean
	}
}

function Map({ entries }: { entries: Models.IEntry[] }) {
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}
	const statusData = getStatusData(entries);
	const lastEntry = entries.at(-1);

	return (
		<ul>
			<li>datapoints: {entries.length - statusData.ignoredEntries}<i>({statusData.ignoredEntries})</i></li>
			<li>Ø upload: {statusData.uploadMean}s </li>
			<li>Ø speed: GPS: {statusData.speedGPSMean}km/h Calc: {statusData.speedCalcMean == "NaN" ? " - " : statusData.speedCalcMean	}km/h </li>
			<li></li>
		</ul>
	)
}

export default Map
