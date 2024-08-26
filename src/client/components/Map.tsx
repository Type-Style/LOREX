import React, { useEffect, useState } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import leafletPolycolor from 'leaflet-polycolor';
import { toGamut, parse, Oklch, formatCss } from 'culori';
import L from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import "../css/map.css";
import { getMaxSpeed } from "../helper/maxSpeed";
leafletPolycolor(L);


// Used to recenter the map to new coordinates
const MapRecenter = ({ lat, lon, zoom }: { lat: number, lon: number, zoom: number }) => {
	const map = useMap();
	useEffect(() => {
		// Fly to that coordinates and set new zoom level
		map.flyTo([lat, lon], zoom);
	}, [lat, lon]);
	return null;
};



const MultiColorPolyline = ({ cleanEntries }: { cleanEntries: Models.IEntry[] }) => {
	const [useRelativeColors] = useState<boolean>(true); // Change candidate; Use color in range to maximum speed, like from 0 to max, rather than fixed range

	let maxSpeed = 0;
	const startColor = parse('oklch(62.8% 0.2577 29.23)') as Oklch; // red
	const calculateHue = function (baseHue, maxSpeed, currentSpeed) {
		// range of currentSpeed and maxSpeed transfered to range from 0 to 360
		const hueOffset = (currentSpeed / maxSpeed) * 360;
		// add  baseHue to the hueOffset and overflow at 360
		return (baseHue + hueOffset) % 360;
	}

	if (useRelativeColors) {
		maxSpeed = getMaxSpeed(cleanEntries);
	}

	return cleanEntries.map((entry, index) => {
		if (!index) { return false; }
		const previousEntry = cleanEntries[index - 1];
		const color = startColor;
		const currentSpeed = entry.speed.gps * 3.6; // convert to km/h

		color.h = calculateHue(color.h, maxSpeed, currentSpeed);
		color.l = currentSpeed > maxSpeed * 0.75 ? color.l = currentSpeed / maxSpeed : color.l;

		const correctedColor = toGamut('rgb', 'oklch', null)(color); // map OKLCH to the RGB gamut


		return (<Polyline
			key={entry.time.created * 1.1 + Math.random()} // random to force rerender while new data is incoming (maxSpeed might have changed)
			positions={[[previousEntry.lat, previousEntry.lon], [entry.lat, entry.lon]]}
			color={formatCss(correctedColor)} weight={5}
		/>)
	});
}

function Map({ entries }: { entries: Models.IEntry[] }) {
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}

	const lastEntry = entries.at(-1);
	const cleanEntries = entries.filter((entry) => !entry.ignore);


	// Function to create custom icon with dynamic className
	function createCustomIcon(entry: Models.IEntry) {
		let className = "";
		let iconSize = 15;
		if (entry.index == 0) {
			className = "start"
		}
		if (entry == lastEntry) {
			className = "end"
		}

		if (className) {
			iconSize = 22;
		}

		return L.divIcon({
			html: `
			<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<title>Marker Arrow</title>
				<polygon fill="var(--contrastText, currentColor)" points="50,0 100,100 0,100" />
			</svg>`,
			shadowUrl: null,
			shadowSize: null,
			shadowAnchor: null,
			iconSize: [iconSize, iconSize],
			iconAnchor: [iconSize / 2, iconSize / 2],
			popupAnchor: [0, 0],
			className: `customMarkerIcon ${className}`,
		});
	}

	return (
		<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13}>
			<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} zoom={13} />
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{cleanEntries.map((entry) => {
				return (
					<div key={entry.time.created}>
						<Marker
							key={entry.index}
							position={[entry.lat, entry.lon]}
							icon={createCustomIcon(entry)}
							rotationAngle={entry.heading}
							rotationOrigin="center"
						>
							<Popup>
								<pre>{JSON.stringify(entry, null, 2)}</pre>
							</Popup>
						</Marker>
					</div>
				)
			})}

			<MultiColorPolyline cleanEntries={cleanEntries} />

		</MapContainer>
	)
}

export default Map
