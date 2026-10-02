import { useMapEvents } from "react-leaflet";
import { layers } from "../scripts/layers";

 /* handle map events and track active layer
used to switch marker design 
and control maxZoom */ 

export const LayerChangeHandler = ({mapStyle, setMapStyle, setActiveLayer}: {mapStyle: string | undefined, setMapStyle: React.Dispatch<React.SetStateAction<string>>, setActiveLayer: (layer: client.Layer) => void}) => {
	useMapEvents({
		baselayerchange: (event) => {
			const newLayer = layers.find((layer) => layer.name === event.name);
			if (!newLayer) { return; }
			setActiveLayer(newLayer);
			if (newLayer.markerStyle !== mapStyle) {
				setMapStyle(newLayer.markerStyle);
			}
		},
	});
	return null;
};
