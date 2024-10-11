/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "*.module.css";
declare namespace client {
	type MarkerStyle = "" | "light" | "dark";

	interface Layer {
		name: string;
		attribution: string;
		url: string;
		markerStyle: MarkerStyle;
		default?: MarkerStyle; // Optional property since not all layers have a default style
		size?: number;
		zoomOffset?: number;
	}

	interface MiniMapProps {
		layer: client.Layer;
		lastEntry: Models.IEntry
		index?: number
	}

	interface entryData {
		isError: boolean,
		status: number,
		message: string,
		fetchTimeData: {last: number, next: number} | null
	}
}


