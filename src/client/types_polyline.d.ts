// Polyline plugin for native Leaflet
import * as L from 'leaflet';

declare module 'leaflet' {
    namespace Polycolor {
        interface Options {
            colors: Array<string | null>;
            weight?: number;
        }
    }

    // Declare the actual polycolor function under the L namespace
    function polycolor(latlngs: L.LatLngExpression[], options: Polycolor.Options): L.Polyline;
}
