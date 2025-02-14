import L from 'leaflet';

export const Icon = (iconObj: { className: string, iconSize: number}, entry: Models.IEntry) => {
	const defaultArrow = `<path fill="var(--contrastText, currentColor)" d="m34.11959,102.6673l-18.15083,-17.53097l31.75703,-30.64393l-31.75703,-30.64391l18.15083,-17.51581l49.91164,48.15972l-49.91164,48.1749z" transform="rotate(-90, 50, 54.5)"/>`
	const triangleArrow = `<polygon fill="var(--contrastText, currentColor)" points="50,0 100,100 0,100" />`

	return L.divIcon({
		html: `<div class="icon ${iconObj.className} ${(Date.now() - entry.time.recieved) <= 60000  ? "animate " : ""}" style="--angle: ${entry.angle || entry.heading }">
			<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<title>Marker Arrow</title>
				${iconObj.className != "none" ? triangleArrow : defaultArrow}	
			</svg>
		</div>`,
		// shadowUrl: null,
		// shadowSize: null,
		// shadowAnchor: null,
		iconSize: [iconObj.iconSize, iconObj.iconSize],
		iconAnchor: [iconObj.iconSize / 2, iconObj.iconSize / 2],
		popupAnchor: [0, 0],
		className: `customMarker`,
	});
}