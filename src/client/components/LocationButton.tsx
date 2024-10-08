import React, { useEffect } from 'react'
import { useMap } from "react-leaflet";
import L from 'leaflet';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { renderToString } from 'react-dom/server';

// Used to recenter the map to new coordinates
export const LocationButton = ({ lat, lon }: { lat: number, lon: number }) => {
	const map = useMap();
	const gpsIcon = renderToString(<GpsFixedIcon style={{ width: '100%', height: '100%', fill: "currentcolor" }} />);
	let justClicked = false;
	useEffect(() => {
		L.easyButton(gpsIcon, function (btn, map) {
			justClicked = true;
			map.locate({
				enableHighAccuracy: true,
				watch: true,
			}).on("locationfound", function (e) {
				
				btn.button.classList.add("active");
				const bounds = L.latLngBounds([[lat, lon], e.latlng]);
				if (justClicked) {
					map.fitBounds(bounds);
				}

				//map.flyTo(e.latlng, map.getZoom());
				
				L.marker(e.latlng, {
					icon: L.divIcon({
						className: "customMarkerIcon geoLocation end none",
						iconSize: L.point(17, 17),
						popupAnchor: [0, -15],
					}),
				}).bindPopup("Your are here :)").addTo(map);
				
				justClicked = false;
			});
		}).addTo(map);
	}, [map]);
	return null;
};