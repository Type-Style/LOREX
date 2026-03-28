import { useMapEvents } from "react-leaflet";
import { layers } from "../scripts/layers";

 /* handle map events and track active layer
used to switch marker design 
and control maxZoom */ 

export const LayerChangeHandler = ({mapStyle, setMapStyle, setActiveLayer}: {mapStyle: string | undefined, setMapStyle: React.Dispatch<React.SetStateAction<string>>, setActiveLayer: React.Dispatch<React.SetStateAction<client.Layer>>}) => {
	useMapEvents({
		baselayerchange: (event) => {
			const newLayer = layers.filter((layer) => layer.name == event.name);
			if (newLayer[0].markerStyle != mapStyle) {
				setMapStyle(newLayer[0].markerStyle);
				setActiveLayer(newLayer[0]);
			}
		},
	});
	return null;
};