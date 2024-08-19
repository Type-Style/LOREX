import React, { useEffect } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
// import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
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

	return (
		<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} scrollWheelZoom={false}>
			<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} zoom={13} />
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{cleanEntries.map((entry) => {
				console.log(entry.index);
				return (
					<Marker key={entry.index} position={[entry.lat, entry.lon]}>
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
