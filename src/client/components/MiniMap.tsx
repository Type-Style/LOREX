import React, { useContext } from 'react'
import { MapContainer, TileLayer } from "react-leaflet";
import { MapRecenter } from "./MapCenter";
import { Context } from "../context";

export default function MiniMap({ layer, lastEntry }: client.MiniMapProps) {

	const [contextObj] = useContext(Context);

	const mapToken = "XXXMaptoken";
	const trafficToken = "XXXTraffictoken";
	const hasTokens = contextObj.mapToken && contextObj.trafficToken;
	let url = layer.url;

	if (url.includes(mapToken)) {
		if (!hasTokens) { return; }
		url = layer.url.replace(mapToken, contextObj.mapToken!)
	}

	if (url.includes(trafficToken)) {
		if (!hasTokens) { return; }
		url = layer.url.replace(trafficToken, contextObj.trafficToken!)
	}

	function handleClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
		const name = (e.currentTarget as HTMLElement).dataset.name;

		// Select all input elements
		const elements = document.querySelectorAll('input.leaflet-control-layers-selector');
		if (!elements) { return };
		let element: HTMLInputElement | null = null;

		// Convert NodeList to an array and iterate using forEach
		Array.from(elements).forEach((el) => {
			const siblingSpan = el.nextElementSibling as HTMLElement;
			if (siblingSpan && siblingSpan.textContent?.trim() === name) {
				element = el as HTMLInputElement;
				element.click();
			}
		});

		if (!element) {
			console.error(`No layer found with the name: ${name}`);
			return;
		}
	}


	return (
		<div className="image cut" data-name={layer.name} onClick={handleClick}>
			<MapContainer className="miniMap" center={[lastEntry.lat, lastEntry.lon]} zoom={15}
				attributionControl={false}
				zoomControl={false}
				boxZoom={false}
				doubleClickZoom={false}
				dragging={false}
				scrollWheelZoom={false}
				touchZoom={false}>
				<MapRecenter lat={lastEntry.lat} lon={lastEntry.lon} zoom={15} fly={false} />
				<TileLayer
					attribution={layer.attribution}
					url={url}
					tileSize={layer.size || 256}
					zoomOffset={layer.zoomOffset || 0}
				/>
			</MapContainer>
		</div>);
}
