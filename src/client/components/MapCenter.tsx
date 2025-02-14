import { useMemo } from "react";
import { useMap } from "react-leaflet";

// Used to recenter the map to new coordinates
export const MapRecenter = ({ lat, lon, zoom, fly }: { lat: number, lon: number, zoom?: number, fly: boolean }) => {
	const map = useMap();
	useMemo(() => {
		if (fly) {
			map.flyTo([lat, lon], zoom || map.getZoom());
		} else {
			map.setView([lat, lon], zoom || map.getZoom());
		}
	}, [map, lat, lon, zoom, fly]);
	return null
};