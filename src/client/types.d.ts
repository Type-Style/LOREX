 
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
		overlay?: boolean;
		maxZoom?: number;
		minZoom?: number;
	}

	interface MiniMapProps {
		layer: client.Layer;
		lastEntry: Models.IEntry
		index?: number
	}

	interface entryData {
		isError: boolean,
		status: number | React.JSX.Element,
		message: string,
		fetchTimeData: {last: number | null, next: number | null}
	}


	interface AppContext  {
		isLoggedIn: boolean;
		setLogin: React.Dispatch<React.SetStateAction<boolean>>;
		userInfo: false | { user: any; exp: any; };
		setUserInfo: React.Dispatch<React.SetStateAction<boolean | { user: any; exp: any; }>>;
		mode: string | undefined;
		setMode: (mode: string | null) => void;
		prefersDarkMode: boolean;
		mapToken: string | null;
		trafficToken: string | null;
	}
	
}


