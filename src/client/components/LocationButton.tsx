import React, { useCallback, useEffect, useRef } from 'react'
import { useMap } from "react-leaflet";
import L from 'leaflet';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { renderToString } from 'react-dom/server';

// Used to recenter the map to new coordinates
export const LocationButton = ({ lat, lon }: { lat: number, lon: number }) => {
	const map = useMap();
	const gpsIcon = renderToString(<GpsFixedIcon style={{ width: '100%', height: '100%', fill: "currentcolor" }} />);
	let justClicked = useRef(false);
	const buttonRef = useRef<L.Control | null>(null);
	const markerRef = useRef<L.Marker | null>(null);
	const [active, setActive] = React.useState(false);


	const addButton = useCallback(() => {
		if (buttonRef.current) {
			buttonRef.current.remove();
		}

		const button = L.easyButton(gpsIcon, function (btn, map) {
			justClicked.current = true;
			setActive(true);
			btn.button.setAttribute("disabled", "disabled");

			map.locate({
				enableHighAccuracy: true,
				watch: true,
			}).on("locationfound", function (e) {
				if (markerRef.current) {
					markerRef.current.remove();
				}

				const bounds = L.latLngBounds([[lat, lon], e.latlng]);
				if (justClicked.current) {
					map.fitBounds(bounds);
				}

				if (justClicked.current) {
					map.flyTo(e.latlng, map.getZoom());
				}

				markerRef.current = L.marker(e.latlng, {
					icon: L.divIcon({
						className: "customMarkerIcon geoLocation end none",
						iconSize: L.point(17, 17),
						popupAnchor: [0, -15],
					}),
				}).bindPopup("Your are here :)").addTo(map);

				justClicked.current = false;
			});
		}).addTo(map);

		buttonRef.current = button;
		button.button.classList.toggle("active", active);
	}, [active, gpsIcon, map, lat, lon, justClicked]);

	useEffect(() => {
		addButton();

	}, [addButton]);


	return null;
};