import { useEffect } from "react";
import { useMap } from "react-leaflet";

export const MapZoomLimit = ({ minZoom = 3, maxZoom = 19 }: { minZoom?: number, maxZoom?: number } ) => {
  const map = useMap();

  useEffect(() => {
    map.setMinZoom(minZoom);
    map.setMaxZoom(maxZoom);

    // Clamp zoom if currently outside bounds
    const currentZoom = map.getZoom();
    if (currentZoom < minZoom) {
      map.setZoom(minZoom);
    } else if (currentZoom > maxZoom) {
      map.setZoom(maxZoom);
    }
  }, [minZoom, maxZoom, map]);

  return null;
};