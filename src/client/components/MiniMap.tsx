import React, { useContext } from 'react'
import { MapContainer, TileLayer } from "react-leaflet";
import { MapRecenter } from "./MapCenter";
import { Context } from "./App";

export default function MiniMap({ layer, lastEntry }: client.MiniMapProps) {

	const [contextObj] = useContext(Context);

	const mapToken = "XXXMaptoken";
	const trafficToken = "XXXTraffictoken";

	function handleClick(e) {
		const name = (e.currentTarget as HTMLElement).dataset.name;

		// Select all input elements
		const elements = document.querySelectorAll('input.leaflet-control-layers-selector');
		if (!elements) { return };
		let element: HTMLInputElement | null = null;

		// Convert NodeList to an array and iterate using forEach
		Array.from(elements).forEach((el) => {
			const siblingSpan = el.nextElementSibling as HTMLElement | null;
			if (siblingSpan && siblingSpan.textContent?.trim() === name) {
				element = el as HTMLInputElement;
			}
		});

		if (!element) {
			console.warn(`No layer found with the name: ${name}`);
		}

		element.click();
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
					url={layer.url.includes(mapToken) ? layer.url.replace(mapToken, contextObj.mapToken) :
						layer.url.includes(trafficToken) ? layer.url.replace(trafficToken, contextObj.trafficToken) : layer.url}
					tileSize={layer.size || 256}
					zoomOffset={layer.zoomOffset || 0}
				/>
			</MapContainer>
		</div>);
}
