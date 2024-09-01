export const layers:client.Layer[] = [
	{
		name: "OSM DE",
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
		markerStyle: ""
	},
	{
		name: "Carto Voyager Light",
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
		markerStyle: "light",
		default: "light"
	},
	{
		name: "Stadia AlidadeSmoothDark",
		attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
		markerStyle: "dark",
		default: "dark"
	},
	{
		name: "ArcGis WorldImagery",
		attribution: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
		markerStyle: "dark"
	},
	// {
	// 	name: "OpenRailway",
	// 	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Map style: &copy; <a href="https://www.OpenRailwayMap.org',
	// 	url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
	// 	markerStyle: mode
	// },	
	{
		name: "Stadia AlidadeSatelite",
		attribution: '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		url: 'https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg',
		markerStyle: "dark"
	},
	{
		name: "Mapbox Satelite Streets",
		attribution: '&copy; <a href="https://www.mapbox.com/" target="_blank">Mapbox</a>',
		url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoidHlwZS1zdHlsZSIsImEiOiJjbGJ4aG14enEwZ2toM3BvNW5uanhuOGRvIn0.7TUEM9vA-EYSt3WW_bcsAA',
		markerStyle: "dark",
		size: 512,
		zoomOffset: -1
	}
]