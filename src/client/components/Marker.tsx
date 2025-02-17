import React from 'react'
import { Marker as LeafletMarker, Popup } from 'react-leaflet';
import { Icon } from "./Icon";

export const Marker = (entry: Models.IEntry, iconObj: { className: string, iconSize: number}) => {
	return (
		<LeafletMarker
			key={entry.time.created}
			position={[entry.lat, entry.lon]}
			icon={Icon(iconObj, entry)}
			rotationAngle={entry.heading}
			rotationOrigin="center"
		>
			<Popup>
				<pre>{JSON.stringify(entry, null, 2)}</pre>
			</Popup>
		</LeafletMarker>
	)
}
