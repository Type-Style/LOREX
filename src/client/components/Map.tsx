import React, { useContext, useState } from 'react'
import { Context } from "../components/App";
import { LayersControl, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import { toGamut, parse, Oklch, formatCss } from 'culori';
import L from 'leaflet';
import "leaflet-easybutton/src/easy-button.js";
import "leaflet-easybutton/src/easy-button.css";
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import "../css/map.css";
import { getMaxSpeed } from "../scripts/maxSpeed";
import { layers } from "../scripts/layers";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import "@changey/react-leaflet-markercluster/dist/styles.min.css";
import { MapRecenter } from "./MapCenter";
import { LocationButton } from "./LocationButton";

const MultiColorPolyline = ({ cleanEntries }: { cleanEntries: Models.IEntry[] }) => {
	const [useRelativeColors] = useState<boolean>(true); // Change candidate; Use color in range to maximum speed, like from 0 to max, rather than fixed range

	let maxSpeed = 0;
	const startColor = parse('oklch(62.8% 0.2577 10)') as Oklch;
	const calculateHue = function (currentSpeed, maxSpeed, calcSpeed) {
		let speed = currentSpeed;
		if (calcSpeed > currentSpeed) {
			speed = 2 * (currentSpeed * calcSpeed) / (currentSpeed + calcSpeed); // Harmonic Meangit
		}
		const hue = (speed / maxSpeed) * 200;

		return hue;
	}

	const calculateLightness = function (hue: number) {
		const baseLightness = 60;
		if (hue > 30) { // max 200
			const lightness = (baseLightness + ((hue - 30) / (200 - 30)) * (100 - baseLightness)) / 100;
			return lightness;
		} else {
			return baseLightness / 100;
		}
	}

	if (useRelativeColors) {
		maxSpeed = getMaxSpeed(cleanEntries);
	}

	return cleanEntries.map((entry, index) => {
		if (!index || entry.time.diff > 300) { return false; }

		const previousEntry = cleanEntries[index - 1];
		const color = structuredClone(startColor);
		const currentSpeed = entry.speed.gps * 3.6; // convert to km/h
		const calcSpeed = entry.speed.horizontal * 3.6;

		color.h = calculateHue(currentSpeed, maxSpeed, calcSpeed);
		color.l = calculateLightness(color.h);

		const correctedColor = toGamut('rgb', 'oklch', null)(color); // map OKLCH to the RGB gamut

		let strokeDashArray = null;

		if (entry.time.diff > 100 || entry.time.diff < 25) { strokeDashArray = "4 8"; }
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
	const [contextObj] = useContext(Context);
	const [mapStyle, setMapStyle] = useState(contextObj.mode);

	const lastEntry = entries.at(-1);
	const cleanEntries = entries.filter((entry) => !entry.ignore);
	const replaceKeyword = "XXXREPLACEXXX";

	function getClassName(entry: Models.IEntry) {
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

		return {
			className,
			iconSize
		}
	}


	// Function to create custom icon with dynamic className
	function createCustomIcon(entry: Models.IEntry, iconObj: { className: string, iconSize: number }) {
		return L.divIcon({
			html: `
			<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<title>Marker Arrow</title>
				<polygon fill="var(--contrastText, currentColor)" points="50,0 100,100 0,100" />
			</svg>`,
			shadowUrl: null,
			shadowSize: null,
			shadowAnchor: null,
			iconSize: [iconObj.iconSize, iconObj.iconSize],
			iconAnchor: [iconObj.iconSize / 2, iconObj.iconSize / 2],
			popupAnchor: [0, 0],
			className: `customMarkerIcon ${iconObj.className}`,
		});
	}

	// custom hook to handle map events and track active layer
	// used to switch marker design
	const LayerChangeHandler = () => {
		useMapEvents({
			baselayerchange: (event) => {
				const newLayer = layers.filter((layer) => layer.name == event.name);
				if (newLayer[0].markerStyle != mapStyle) {
					setMapStyle(newLayer[0].markerStyle);
				}
			},
		});
		return null;
	};

	function renderMarker(entry: Models.IEntry, iconObj: { className: string, iconSize: number }) {
		return (
			<Marker
				key={entry.time.created}
				position={[entry.lat, entry.lon]}
				icon={createCustomIcon(entry, iconObj)}
				rotationAngle={entry.heading}
				rotationOrigin="center"
			>
				<Popup>
					<pre>{JSON.stringify(entry, null, 2)}</pre>
				</Popup>
			</Marker>
		)
	}



	return (
		<div className="mapStyle" data-mui-color-scheme={mapStyle}>
			<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} maxZoom={19}>
				<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} fly={true} />
				<LocationButton lat={lastEntry.lat} lon={lastEntry.lon} />
				<LayerChangeHandler />
				<LayersControl position="bottomright">
					{layers.map((layer, index) => {
						return (
							<LayersControl.BaseLayer
								key={index}
								checked={layer.default == contextObj.mode}
								name={layer.name}
							>
								<TileLayer
									attribution={layer.attribution}
									url={layer.url.includes(replaceKeyword) ? layer.url.replace(replaceKeyword, contextObj.mapToken) : layer.url}
									tileSize={layer.size || 256}
									zoomOffset={layer.zoomOffset || 0}
									maxZoom={19}

								/>
							</LayersControl.BaseLayer>
						)
					})}
				</LayersControl>

				<MarkerClusterGroup disableClusteringAtZoom={15}>
					{cleanEntries.map((entry) => {
						const iconObj = getClassName(entry);
						if (iconObj.className != "none") { return } // exclude start and end from being in cluster group;
						return renderMarker(entry, iconObj);
					})}
				</MarkerClusterGroup>


				{/* (re)start and end end markers */}
				{cleanEntries.map((entry) => {
					const iconObj = getClassName(entry);
					if (iconObj.className == "none") { return } // exclude already rendered markers;

					return renderMarker(entry, iconObj);
				})}

				<MultiColorPolyline cleanEntries={cleanEntries} />
			</MapContainer>
		</div >
	)
}

export default Map
