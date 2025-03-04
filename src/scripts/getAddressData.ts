import axios from "axios";
import logger from "./logger";

let lastNominatimRequestTimestamp = 0;

async function fetchData(url: string, timeout = 3000): Promise<NominatimResponse | null> {
	if (lastNominatimRequestTimestamp + 4000 > Date.now()) { // do not fetch data too often
		logger.log("🏠 Nominatim request throttled");
		return null;
	}

	try {
		lastNominatimRequestTimestamp = Date.now();
		const [responseZoom17, responseZoom18] = await Promise.all([
			axios.get<NominatimResponse>(url + "&zoom=17", { timeout }),
			axios.get<NominatimResponse>(url + "&zoom=18", { timeout }),
		]);

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

	if (response.name &&
		response.addresstype != "road" &&
		response.addresstype != "state") {
		address += "(" + sanitizeString(response.name) + ")";
	}

	if (response.address?.road) {
		address += " " + sanitizeString(response.address?.road);
	}

	if (response.address?.house_number) {
		address += " " + sanitizeString(response.address?.house_number);
	}

	if (response.address?.city || response.address?.town) {
		address += ", " + sanitizeString(response.address?.city || response.address?.town);
	}

	return address;
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

