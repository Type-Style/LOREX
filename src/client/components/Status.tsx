import React from 'react'
import { getMaxSpeed } from "../scripts/maxSpeed";
import "../css/status.css";
import StorageIcon from '@mui/icons-material/Storage';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import EastIcon from '@mui/icons-material/East';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import SportsScoreIcon from '@mui/icons-material/SportsScore';


function getStatusData(entries: Models.IEntry[]) {
	const cleanEntries = entries.filter((entry: Models.IEntry) => !entry.ignore);
	const lastEntry = cleanEntries.at(-1);

	function getMean(prop:string) {
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
			return accumulatorValue + (typeof value == "number" ? value : 0);

		}, 0) / divider; // now that all values have been added together, devide by amount of them

		return value;
	}


	function getVertical() {
		let up = 0, down = 0;

		for (let index = 0; index < cleanEntries.length; index++) {
			const entry = cleanEntries[index];
			if (!entry.distance) { continue; }

			const vertical = entry.distance.vertical;

			if (vertical > 0) {
				up += vertical;
			} else if (vertical < 0) {
				down += vertical;
			}
		}

		return [(up / 1000).toFixed(2), (down / 1000).toFixed(2)];
	}

	function getDistance() {
		return cleanEntries.reduce((accumulatorValue: number, entry) => {
			if (!entry.distance) { return accumulatorValue }
			return accumulatorValue + entry.distance.horizontal;
		}, 0) / 1000;
	}

	function getEta() {
		const lastEntry = cleanEntries.at(-1);
		const eta = lastEntry?.eta;
		if (!eta) { return undefined; }

		const currentTime = Date.now();
		const diffMinutes = (eta - currentTime) / 60000; // Difference between eta and current time
		const diffMinutesAtCreated = (eta - lastEntry.time.created) / 60000;

		const print = diffMinutes > 0 ? diffMinutes : diffMinutesAtCreated;
		console.log("print", print);
		if (print <= 0.09) { return undefined; } // rounded in output avoid showing 0.0 minutes

		return print >= 60 ? (print / 60).toFixed(1) + ' hours' : print.toFixed(1) + ' minutes';
	}

	const ignoredEntries = entries.length - cleanEntries.length;
	let uploadMean: number | string | undefined = getMean("time.uploadDuration");
	if (uploadMean <= 0) { uploadMean = undefined } else { uploadMean = uploadMean.toFixed(3); }
	const speedGPSMean = (getMean("speed.gps") * 3.6).toFixed(1);
	const speedCalcMean = (getMean("speed.horizontal") * 3.6).toFixed(1);
	const verticalCalc = getVertical();
	const maxSpeed = getMaxSpeed(cleanEntries).toFixed(1);
	const distance = getDistance().toFixed(2);
	const eta = getEta();
	const eda = lastEntry?.eda ? (lastEntry.eda / 1000).toFixed(2) : undefined;

	return {
		ignoredEntries,
		uploadMean,
		speedGPSMean,
		speedCalcMean,
		maxSpeed,
		verticalCalc,
		distance,
		eta,
		eda
	}
}

function Status({ entries }: Models.IEntries) {
	if (!entries?.length) { return; }
	const statusData = getStatusData(entries);

	return (
		<table className="statusTable">
			<tbody>
				<tr>
					<td><StorageIcon /></td>
					<th>data</th>
					<td>
						{entries.length - statusData.ignoredEntries}<i className="strike" title="ignored">({statusData.ignoredEntries})</i>
					</td>
				</tr>

				{statusData.uploadMean &&
					<tr>
						<td><NetworkCheckIcon /></td>
						<th>Ø upload</th>
						<td>
							{statusData.uploadMean}s
						</td>
					</tr>
				}

				<tr>
					<td><SpeedIcon /></td>
					<th>Ø speed</th>
					<td>
						<span>GPS: {statusData.speedGPSMean}km/h</span> <span>Calc: {statusData.speedCalcMean == "NaN" ? " - " : statusData.speedCalcMean}km/h</span>
					</td>
				</tr>

				<tr>
					<td><BoltIcon /></td>
					<th>maxSpeed</th>
					<td>
						<span>{statusData.maxSpeed}km/h</span>
					</td>
				</tr>

				<tr>
					<td><ShowChartIcon /></td>
					<th>vertical</th>
					<td>
						<span>{statusData.verticalCalc[0]}km up</span>,  <span>{statusData.verticalCalc[1]}km down</span>
					</td>
				</tr>

				<tr>
					<td><EastIcon /></td>
					<th>Distance</th>
					<td>
						<span>{statusData.distance}km</span>
					</td>
				</tr>

				{statusData.eda &&
					<tr>
						<td><SportsScoreIcon /></td>
						<th>EDA</th>
						<td>
							<span>{statusData.eda}km</span>
						</td>
					</tr>
				}

				{statusData.eta &&
					<tr>
						<td><WatchLaterOutlinedIcon /></td>
						<th>ETA</th>
						<td>
							<span>{statusData.eta}</span>
						</td>
					</tr>
				}

			</tbody>
		</table>
	)
}

export default Status
