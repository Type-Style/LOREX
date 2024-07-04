import React from 'react'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import * as css from "../css/map.module.css";

function Map({ entries }: { entries: Models.IEntry[] }) {
	if(!entries?.length) {
		return ( "No Data to be displayed" );		
	}
	const lastEntry = entries.at(-1);

	return (
		<MapContainer className={css.mapContainer} center={[lastEntry.lat, lastEntry.lon]} zoom={13} scrollWheelZoom={false}>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker position={[lastEntry.lat, lastEntry.lon]}>
				<Popup>
					{JSON.stringify(lastEntry)}
				</Popup>
			</Marker>
		</MapContainer>
	)
}

export default Map
