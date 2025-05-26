import React, { useEffect, useRef } from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import { Icon } from "./Icon";
import { PopupContent } from "./PopupContent";
import { usePopup } from "../hooks/usePopup";

export const Marker = ({ entry, iconObj, markerRef, cleanEntries }: {
	entry: Models.IEntry; iconObj: { className: string; iconSize: number }; markerRef?: (marker: L.Marker | null) => void; cleanEntries: Models.IEntry[];
}) => {
	const { opened, closed } = usePopup();
	const internalRef = useRef<L.Marker | null>(null);

	useEffect(() => { // register popup events
		const marker = internalRef.current;
		if (!marker) return;

		const handleOpen = () => opened(entry, internalRef);
		const handleClose = () => closed(entry, internalRef);

		marker.on('popupopen', handleOpen);
		marker.on('popupclose', handleClose);

		return () => {
			marker.off('popupopen', handleOpen);
			marker.off('popupclose', handleClose);
		};
	}, [entry, opened, closed]);

	return (
		<LeafletMarker
			position={[entry.lat, entry.lon]}
			icon={Icon(iconObj, entry)}
			rotationAngle={entry.heading}
			rotationOrigin="center"
			ref={(markerInstance) => {
				internalRef.current = markerInstance;
				if (markerRef) markerRef(markerInstance);
			}}
		>
			<Popup>
				<PopupContent entry={entry} cleanEntries={cleanEntries} />
			</Popup>
		</LeafletMarker>
	);
};