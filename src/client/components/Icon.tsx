import L from 'leaflet';

export const defaultArrow = `<path fill="var(--fillColor, currentColor)" d="m34.11959,102.6673l-18.15083,-17.53097l31.75703,-30.64393l-31.75703,-30.64391l18.15083,-17.51581l49.91164,48.15972l-49.91164,48.1749z" transform="rotate(-90, 50, 54.5)"/>`
export const triangleArrow = `<polygon fill="var(--fillColor, currentColor)" points="50,0 100,100 0,100" />`

export const Icon = ({ className = '', iconSize }: { className?: string, iconSize: number}, entry: Models.IEntry) => {

	return L.divIcon({
		html: `<div class="icon ${className}" data-entry-index="${entry.index}" style="--angle: ${entry.angle ?? entry.heading }">
			<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<title>Marker Arrow</title>
				${!className.includes("none") ? triangleArrow : defaultArrow}
			</svg>
		</div>`,
		// shadowUrl: null,
		// shadowSize: null,
		// shadowAnchor: null,
		iconSize: [iconSize, iconSize],
		iconAnchor: [iconSize / 2, iconSize / 2],
		popupAnchor: [0, 0],
		className: `customMarker`,
	});
}
