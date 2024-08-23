import React, { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import leafletPolycolor from 'leaflet-polycolor';
import { formatRgb, toGamut, parse, Oklch } from 'culori';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import "../css/map.css";
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
	const map = useMap();
	const useRelativeColors = true; // Change candidate; Use color in range to maximum speed, like from 0 to max, rather than fixed range

	function calculateHue(baseHue, maxSpeed, currentSpeed) {
		// range of currentSpeed and maxSpeed transfered to range from 0 to 360
		const hueOffset = (currentSpeed / maxSpeed) * 360;
		// add  baseHue to the hueOffset and overflow at 360
		const hue = (baseHue + hueOffset) % 360;

		return hue;
	}

	useEffect(() => {
		if (map) {
			let maxSpeed = 0;

			if (useRelativeColors) {
				maxSpeed = cleanEntries.reduce((maxSpeed, entry) => {
					// compare the current entry's GPS speed with the maxSpeed found so far
					return Math.max(maxSpeed, entry.speed.gps);
				}, cleanEntries[0].speed.gps);
				maxSpeed *= 3.6; // convert M/S to KM/h	
			}

			const colorsArray = cleanEntries.map((entry) => {
				const startColor = parse('oklch(62.8% 0.2577 29.23)') as Oklch; // red
				const currentSpeed = entry.speed.gps * 3.6; // convert to km/h

				startColor.h = calculateHue(startColor.h, maxSpeed, currentSpeed);
				startColor.l = currentSpeed > maxSpeed * 0.8 ? startColor.l = currentSpeed / maxSpeed : startColor.l;

				const rgbInGamut = toGamut('rgb', 'oklch', null)(startColor); // map OKLCH to the RGB gamut
				const colorRgb = formatRgb(rgbInGamut); // format the result as an RGB string

				return colorRgb;
			});

			const polylineArray: LatLngExpression[] = cleanEntries.map((entry) => ([entry.lat, entry.lon]));

			
		}
	}, [map]);

	return null;
};

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
		<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} preferCanvas={true}>
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

						<MultiColorPolyline cleanEntries={cleanEntries} />
					</div>
				)
			})}





		</MapContainer>
	)
}

export default Map
