import React, { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css'; // Re-uses images from ~leaflet package
// import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import * as css from "../css/map.module.css";


// Used to recenter the map to new coordinates
const MapRecenter= ({ lat, lng, zoomLevel }) => {
  const map = useMap();

  useEffect(() => {
    // Fly to that coordinates and set new zoom level
    map.flyTo([lat, lng], zoomLevel );
  }, [lat, lng]);
  return null;

};

function Map({ entries }: { entries: Models.IEntry[] }) {
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}
	const lastEntry = entries.at(-1);

	return (
		<MapContainer className={css.mapContainer} center={[lastEntry.lat, lastEntry.lon]} zoom={13} scrollWheelZoom={false}>
			<MapRecenter lat={lastEntry.lat} lng={lastEntry.lon} zoomLevel={13} />
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker position={[lastEntry.lat, lastEntry.lon]}>
				<Popup>
					{JSON.stringify(lastEntry, null, 2)}
				</Popup>
			</Marker>
		</MapContainer>
	)
}

export default Map
