import { useEffect } from 'react'
import { useMap } from "react-leaflet";

// Used to recenter the map to new coordinates
export const MapRecenter = ({ lat, lon, zoom, fly }: { lat: number, lon: number, zoom?: number, fly: boolean }) => {
	const map = useMap();
	useEffect(() => {
		// Fly to that coordinates and set new zoom level
		if (fly) {
			map.flyTo([lat, lon], zoom || map.getZoom());
		} else {
			map.setView([lat, lon], zoom || map.getZoom());
		}
	}, [lat, lon]);
	return null;
};