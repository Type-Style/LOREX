import React, { useContext, useState } from 'react'
import { Context } from "../components/App";
import { LayersControl, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from "react-leaflet-markercluster";
import { MapRecenter } from "./MapCenter";
import { LocationButton } from "./LocationButton";
import { MultiColorPolyline } from "./MultiColorPolyline";
import { Marker } from "./Marker";
import { layers } from "../scripts/layers";
import "leaflet-easybutton/src/easy-button.js";
import "leaflet-easybutton/src/easy-button.css";
import 'leaflet-rotatedmarker';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-markercluster/styles'
import "../css/map.css";

function Map({ entries }: { entries: Models.IEntry[] }) {
	const [contextObj] = useContext(Context);
	const [mapStyle, setMapStyle] = useState(contextObj.mode);

	if (!contextObj.userInfo) {
		return <strong className="noData cut">No Login</strong>
	}
	if (!entries?.length && contextObj.userInfo && !contextObj.isLoggedIn) {  // check for entries prevents hiding map when logged out due expired token
		return ""; // empty here, since map is still there when entries, and expired message is shown in top row
	}
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}

	const lastEntry = entries.at(-1);
	const cleanEntries = entries.filter((entry) => !entry.ignore);
	const mapToken = "XXXMaptoken";
	const trafficToken = "XXXTraffictoken";

	const getClassName = (entry: Models.IEntry) => {
		const isStart = entry.index == 0 || entry.time.diff >= 300;
		const isEnd = entry == lastEntry;
		const className = isStart ? "start" : isEnd ? "end" : "none";
		const iconSize = className != "none" ? 22 : 14;

		return { className, iconSize }
	}

	/* handle map events and track active layer
	used to switch marker design */ 
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

	return (
		<div className="mapStyle" data-mui-color-scheme={mapStyle}>
			<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} maxZoom={19}>
				<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} fly={true} />
				<LocationButton lat={lastEntry.lat} lon={lastEntry.lon} />
				<LayerChangeHandler />
				<LayersControl position="bottomright">
					{layers.map((layer, index) => {
						if (layer.overlay) { return }
						return (
							<LayersControl.BaseLayer
								key={index}
								checked={layer.default == contextObj.mode}
								name={layer.name}
							>
								<TileLayer
									attribution={layer.attribution}
									url={layer.url.includes(mapToken) ? layer.url.replace(mapToken, contextObj.mapToken) :
										layer.url.includes(trafficToken) ? layer.url.replace(trafficToken, contextObj.trafficToken) : layer.url}
									tileSize={layer.size || 256}
									zoomOffset={layer.zoomOffset || 0}
									maxZoom={19}
								/>
							</LayersControl.BaseLayer>
						)
					})}

					{/* overlays */
						layers.map((layer, index) => {
							if (!layer.overlay) { return }
							return (
								<LayersControl.Overlay
									key={index}
									checked={false}
									name={layer.name}>
									<TileLayer
										attribution={layer.attribution}
										url={layer.url.includes(mapToken) ? layer.url.replace(mapToken, contextObj.mapToken) :
											layer.url.includes(trafficToken) ? layer.url.replace(trafficToken, contextObj.trafficToken) : layer.url}
										tileSize={layer.size || 256}
										zoomOffset={layer.zoomOffset || 0}
										maxZoom={19}
									/>
								</LayersControl.Overlay>
							)
						})}

				</LayersControl>

				<MarkerClusterGroup disableClusteringAtZoom={14} animateAddingMarkers={true} maxClusterRadius={25}>
					{cleanEntries.map((entry) => {
						const iconObj = getClassName(entry);
						if (iconObj.className != "none") { return } // exclude start and end from being in cluster group;
						return Marker(entry, iconObj);
					})}
				</MarkerClusterGroup>


				{/* (re)start and end end markers */}
				{cleanEntries.map((entry) => {
					const iconObj = getClassName(entry);
					if (iconObj.className == "none") { return } // exclude already rendered markers;

					return Marker(entry, iconObj);
				})}

				<MultiColorPolyline cleanEntries={cleanEntries} />
			</MapContainer>
		</div >
	)
}

export default Map
