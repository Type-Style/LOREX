import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Context } from "../context";
import { LayersControl, MapContainer, TileLayer } from 'react-leaflet'
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
import { LayerChangeHandler } from "./LayoutChangeHandler";
import { exceed } from "../scripts/maxSpeed";
import { MapHideSmallCluster } from "./MapHideSmallCluster";
import { MapZoomLimit } from "./MapZoomLimit";
import { usePopup } from "../hooks/usePopup";

function Map({ entries }: { entries: Array<Models.IEntry> }) {
	const cleanEntries = entries.filter((entry) => !entry.ignore);
	const [contextObj] = useContext(Context);
	const [mapStyle, setMapStyle] = useState(contextObj.mode);
	const [activeLayer, setActiveLayer] = useState<client.Layer>();
	const { getUrlParameterValue } = usePopup();
	const [markersReady, setMarkersReady] = useState(false);
	const markerRefs = useRef<Record<number, L.Marker>>({});
	const handleMarkerRef = useCallback((index: number, marker: L.Marker | null) => {
		if (marker) {
			markerRefs.current[index] = marker;

			// When all markers are set, mark ready
			if (Object.keys(markerRefs.current).length === cleanEntries.length) {
				setMarkersReady(true);
			}
		}
	}, [cleanEntries.length]);

	if (!contextObj.userInfo) {
		return <strong className="noData cut">No Login</strong>
	}
	if (!entries?.length && contextObj.userInfo && !contextObj.isLoggedIn) {  // check for entries prevents hiding map when logged out due expired token
		return ""; // empty here, since map is still there when entries, and expired message is shown in top row
	}
	if (!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}

	const lastEntry = entries.at(-1) as Models.IEntry;
	const hasTokens = contextObj.mapToken && contextObj.trafficToken;
	const mapToken = "XXXMaptoken";
	const trafficToken = "XXXTraffictoken";

	const getClassName = (entry: Models.IEntry) => {
		const isStart = entry == cleanEntries[0] || (entry.time.diff && entry.time.diff >= 300);
		const isEnd = entry == lastEntry;
		let className = isEnd ? "end" : isStart ? "start" : "none"; // yes end is mostrecent and is more important than start
		const iconSize = className != "none" ? 22 : 14;
		className = (Date.now() - entry.time.recieved) <= 60000 ? "animate " + className : className; // when entry is recent append animate class

		exceed(entry) ? className += " maxSpeed " : "";

		return { className, iconSize }
	}

	useEffect(() => { // opening popups based on URL or most recent marker if fresh
		if (!markersReady) return;
		const popupIndex = getUrlParameterValue("popup");
		cleanEntries.forEach(entry => {
			const marker = markerRefs.current[entry.index];
			if (!marker) return;
			const parameterMatchesMarker = popupIndex === entry.index.toString();
			const isLastMarker = entry === lastEntry;
			const iconObj = getClassName(entry);
			if ((iconObj.className.includes("animate") && isLastMarker) || parameterMatchesMarker) {
				setTimeout(() => { // mandatory for marker inside cluster group
					marker.openPopup();
				}, 150);
			}
		});
	}, [markersReady, entries]);


	return (
		<div className="mapStyle" data-mui-color-scheme={mapStyle}>
			<MapContainer className="mapContainer" center={[lastEntry.lat, lastEntry.lon]} zoom={13} maxZoom={19}>
				<MapZoomLimit minZoom={activeLayer?.minZoom} maxZoom={activeLayer?.maxZoom} />
				<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} fly={true} />
				<MapHideSmallCluster />
				<LocationButton lat={lastEntry.lat} lon={lastEntry.lon} />
				<LayerChangeHandler mapStyle={mapStyle} setMapStyle={setMapStyle} setActiveLayer={setActiveLayer} />

				{contextObj.isLoggedIn && <LayersControl position="bottomright">
					{layers.map((layer, index) => {
						if (layer.overlay) { return }
						let url = layer.url;

						if (url.includes(mapToken)) {
							if (hasTokens) {
								url = layer.url.replace(mapToken, contextObj.mapToken!)
							} else {
								return;
							}
						}

						return (
							<LayersControl.BaseLayer
								key={index}
								checked={layer.default == contextObj.mode}
								name={layer.name}
							>
								<TileLayer
									attribution={layer.attribution}
									url={url}
									tileSize={layer.size || 256}
									zoomOffset={layer.zoomOffset || 0}
									maxZoom={layer.maxZoom || 19}
									maxNativeZoom={layer.maxZoom || 19}
									minZoom={layer.minZoom || 0}
									minNativeZoom={layer.minZoom || 0}
								/>
							</LayersControl.BaseLayer>
						)
					})}

					{/* overlays */
						layers.map((layer, index) => {
							if (!layer.overlay) { return }
							let url = layer.url;

							if (url.includes(trafficToken)) {
								if (hasTokens) {
									url = layer.url.replace(trafficToken, contextObj.trafficToken!)
								} else {
									return;
								}
							}

							return (
								<LayersControl.Overlay
									key={index}
									checked={false}
									name={layer.name}>

									<TileLayer
										attribution={layer.attribution}
										url={url}
										tileSize={layer.size || 256}
										zoomOffset={layer.zoomOffset || 0}
										maxZoom={19}
									/>
								</LayersControl.Overlay>
							)
						})}

				</LayersControl>}

				{/* markers in group for clustering */}
				<MarkerClusterGroup key={lastEntry.index} disableClusteringAtZoom={14} animateAddingMarkers={true} maxClusterRadius={20}>
					{cleanEntries.map((entry, index) => {
						const iconObj = getClassName(entry);
						if (iconObj.className.includes("end")) { return } // exclude end from being in cluster group
						return <Marker
							key={entry.time.created + 0.125}
							entry={entry} cleanEntries={cleanEntries}
							iconObj={getClassName(entry)}
							markerRef={(marker) => handleMarkerRef(entry.index, marker)}
						/>
					})}
				</MarkerClusterGroup>


				{/* end marker or last / current marker */}
				<Marker
					key={lastEntry.time.created + 0.25}
					entry={lastEntry}
					cleanEntries={cleanEntries}
					iconObj={getClassName(lastEntry)}
					markerRef={(marker) => handleMarkerRef(lastEntry.index, marker)}
					lastMarker={true}
				/>

				<MultiColorPolyline key={lastEntry.index + 0.75} cleanEntries={cleanEntries} />
			</MapContainer>
		</div >
	)
}

export default Map