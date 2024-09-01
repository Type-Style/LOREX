import React, { useContext, useEffect, useState } from 'react'
import { Context } from "../components/App";
import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { toGamut, parse, Oklch, formatCss } from 'culori';
import L from 'leaflet';
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import "../css/map.css";
import { getMaxSpeed } from "../helper/maxSpeed";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";

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

		let strokeDashArray = null;

		if (entry.time.diff > 100) { strokeDashArray = "4 8"; }
		return (<Polyline
			key={entry.time.created * 1.1 + Math.random()} // random to force rerender while new data is incoming (maxSpeed might have changed)
			positions={[[previousEntry.lat, previousEntry.lon], [entry.lat, entry.lon]]}
			color={formatCss(correctedColor)}
			weight={5}
			dashArray={strokeDashArray}
			lineCap={"butt"}

		/>)
	});
}

function Map({ entries }: { entries: Models.IEntry[] }) {
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}
	const [, , , , mode] = useContext(Context);
	const [mapStyle, setMapStyle] = useState(mode);

	const lastEntry = entries.at(-1);
	const cleanEntries = entries.filter((entry) => !entry.ignore);
	const cleanEntriesWithoutLast = cleanEntries.slice(0, -1);


	// Function to create custom icon with dynamic className
	function createCustomIcon(entry: Models.IEntry) {
		let className = "none";
		let iconSize = 14;
		if (entry.index == 0 || entry.time.diff >= 300) {
			className = "start"
		}
		if (entry == lastEntry) {
			className = "end"
		}

		if (className != "none") {
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

	const layers = [
		{
			name: "OSM DE",
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
			markerStyle: mode
		},
		{
			name: "ArcGis WorldImagery",
			attribution: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
			markerStyle: "dark"
		},
		// {
		// 	name: "OpenRailway",
		// 	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org',
		// 	url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
		// 	markerStyle: mode
		// },
		{
			name: "Carto Voyager Light",
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
			url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
			markerStyle: "light",
			default: mode == "light"
		},
		{
			name: "Stadia AlidadeSmoothDark",
			attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
			markerStyle: "dark",
			default: mode == "dark"
		},
		{
			name: "Stadia AlidadeSatelite",
			attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			url: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg',
			markerStyle: "dark"
		},
		{
			name: "Mapbox Satelite Streets",
			attribution: '&copy; <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
			url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHlwZS1zdHlsZSIsImEiOiJjbGJ4aG14enEwZ2toM3BvNW5uanhuOGRvIn0.7TUEM9vA-EYSt3WW_bcsAA',
			markerStyle: "dark"
		}
	]


	// custom hook to handle map events and track active layer
	// used to switch marker design
	const LayerChangeHandler = () => {
		useMapEvents({
			baselayerchange: (event) => {
				const newLayer = layers.filter((layer) => layer.name == event.name);
				console.log(newLayer);
				if (newLayer[0].markerStyle != mapStyle) {
					setMapStyle(newLayer[0].markerStyle);
				}
			},
		});
		return null;
	};


	return (
		<div className="mapStyle" data-mui-color-scheme={mapStyle}>
			<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13}>
				<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} zoom={13} />
				<LayerChangeHandler />
				<LayersControl position="bottomright">
					{layers.map((layer, index) => {
						return (
							<LayersControl.BaseLayer
								key={index}
								checked={layer.default ? true : false}
								name={layer.name}
							>
								<TileLayer
									attribution={layer.attribution}
									url={layer.url}
								/>
							</LayersControl.BaseLayer>
						)
					})}
				</LayersControl>

				<MarkerClusterGroup>
					{cleanEntriesWithoutLast.map((entry) => {
						return (
							<Marker
								key={entry.time.created}
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
				</MarkerClusterGroup>


				{/* lastEntry */}
				<Marker
					key={lastEntry.time.created}
					position={[lastEntry.lat, lastEntry.lon]}
					icon={createCustomIcon(lastEntry)}
					rotationAngle={lastEntry.heading}
					rotationOrigin="center"
				>
					<Popup>
						<pre>{JSON.stringify(lastEntry, null, 2)}</pre>
					</Popup>
				</Marker>

				<MultiColorPolyline cleanEntries={cleanEntries} />
			</MapContainer>
		</div>
	)
}

export default Map
