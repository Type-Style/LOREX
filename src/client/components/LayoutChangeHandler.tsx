import { useMapEvents } from "react-leaflet";
import { layers } from "../scripts/layers";

 /* handle map events and track active layer
used to switch marker design */ 

export const LayerChangeHandler = ({mapStyle, setMapStyle}: {mapStyle: string | undefined, setMapStyle: React.Dispatch<React.SetStateAction<string>>}) => {
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