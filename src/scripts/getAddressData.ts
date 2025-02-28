import axios from "axios";
import logger from "./logger";

let lastNominatimRequestTimestamp = 0;

async function fetchData(url: string, timeout = 3000): Promise<NominatimResponse | null> {
	console.log("stop sending?", lastNominatimRequestTimestamp + 4000 > Date.now())
	if (lastNominatimRequestTimestamp + 4000 > Date.now()) { // do not fetch data too often
		logger.log("🏠 Nominatim request throttled");
		return null;
	}

	try {
		lastNominatimRequestTimestamp = Date.now();
		const responseZoom17 = await axios.get<NominatimResponse>(url + "&zoom=17", { timeout });
		const responseZoom18 = await axios.get<NominatimResponse>(url + "&zoom=18", { timeout });
		
		const combinedResponse = {
			...responseZoom17.data,
			...responseZoom18.data,
			address: {
				...responseZoom17.data.address,
				...responseZoom18.data.address,
			},
			extratags: {
				...responseZoom17.data.extratags,
				...responseZoom18.data.extratags,
			}
		};

		return combinedResponse;

	} catch (error) {
		if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
			logger.error("🏠 Nominatim request timed out");
		} else {
			logger.error(`🏠 Nominatim failed, ${error}`);
		}
		return null;
	}
}

function sanitizeString(input: string): string {
	if (!input && typeof input !== 'string') return '';
	let sanitized = input.trim().substring(0, 100); // Limit to 100 chars
	return sanitized.replace(/[&<>"'`]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[char] || '')); // Escape special characters
}


function getAddressFromResponse(response: NominatimResponse): string {
	let address = "";
	const appendAddressPart = (part: string | undefined) => {
		if (part) {
			address = address + (address ? " " : "") + sanitizeString(part);
		}
	};

	appendAddressPart(response.address?.road);
	appendAddressPart(response.address?.house_number) + ", ";
	appendAddressPart(response.address?.city);

	return address || "";
}

function getMaxSpeedFromResponse(response: NominatimResponse): number | null {
	const maxSpeed = Number(response.extratags?.maxspeed) || null;

	return maxSpeed;
}

export async function getAddressData(lat: number, lon: number): Promise<{ address: string; maxSpeed: number | null }> {
	const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&extratags=1`;
	const nominatimResponse = await fetchData(url);
	const returnObj: { address: string; maxSpeed: number | null } = { address: "", maxSpeed: null };
	if (!nominatimResponse) { return returnObj; }

	returnObj.address = getAddressFromResponse(nominatimResponse);
	returnObj.maxSpeed = getMaxSpeedFromResponse(nominatimResponse);

	return returnObj;
}

