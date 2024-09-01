import React from 'react'
import { MapContainer, TileLayer } from "react-leaflet";
import { MapRecenter } from "./MapCenter";

export default function MiniMap({ layer, lastEntry, index }: client.MiniMapProps) {
	function handleClick() {
		const elements = document.querySelectorAll('input.leaflet-control-layers-selector');
		const el = elements[index] as HTMLInputElement | null;
		if (!elements || !el) { return; }

		el.click();
	}

	return (
		<div className="image cut" onClick={handleClick}>
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
					url={layer.url}
					tileSize={layer.size || 256}
					zoomOffset={layer.zoomOffset || 0}
				/>
			</MapContainer>
		</div>);
}
