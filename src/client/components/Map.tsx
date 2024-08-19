import React, { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L, { Icon, IconOptions } from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import "../css/map.css";
import { LatLngExpression } from "leaflet";



// Used to recenter the map to new coordinates
const MapRecenter = ({ lat, lon, zoom }: { lat: number, lon: number, zoom: number }) => {
	const map = useMap();

	useEffect(() => {
		// Fly to that coordinates and set new zoom level
		map.flyTo([lat, lon], zoom);
	}, [lat, lon]);
	return null;

};

function Map({ entries }: { entries: Models.IEntry[] }) {
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}

	const lastEntry = entries.at(-1);
	const cleanEntries = entries.filter((entry) => !entry.ignore);

	const polyline: LatLngExpression[] = cleanEntries.map((entry) => ([entry.lat, entry.lon]));


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
			iconAnchor: [iconSize/2, iconSize/2],
			popupAnchor: [0, 0],
			className: `customMarkerIcon ${className}`,
		});
	}
	return (
		<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} scrollWheelZoom={false}>
			<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} zoom={13} />
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{cleanEntries.map((entry) => {
				return (
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
				)
			})}

			<Polyline pathOptions={{ color: 'red' }} positions={polyline} />

		</MapContainer>
	)
}

export default Map
