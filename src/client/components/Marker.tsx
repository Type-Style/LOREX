import React, { useEffect, useRef } from 'react'
import { Marker as LeafletMarker, Popup} from 'react-leaflet';
import { Icon } from "./Icon";
import { PopupContent } from "./PopupContent";

export const Marker = ({ entry, iconObj, ref, cleanEntries }: { entry: Models.IEntry; iconObj: { className: string; iconSize: number }, ref?: any, cleanEntries: Models.IEntry[] }) => {

	useEffect(() => {
		if (ref?.current && iconObj.className.includes("animate")) {
			ref.current.openPopup();
		}
	}, [ref]);

	return (
		<LeafletMarker
			key={entry.time.created + 0.5}
			position={[entry.lat, entry.lon]}
			icon={Icon(iconObj, entry)}
			rotationAngle={entry.heading}
			rotationOrigin="center"
			ref={ref}
		>
			<Popup>
				<PopupContent entry={entry} cleanEntries={cleanEntries} />
				{/* <pre>{JSON.stringify(entry, null, 2)}</pre> */}
			</Popup>
		</LeafletMarker>
	)
}
