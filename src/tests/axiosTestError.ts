import axios, { AxiosError } from "axios";

function stringifyErrorDetail(value: unknown): string | undefined {
	if (value === undefined || value === null) { return undefined; }
	if (typeof value === "string") { return value; }

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function getResponseMessage(data: unknown): string | undefined {
	if (typeof data === "object" && data !== null && "message" in data) {
		return stringifyErrorDetail(data.message);
	}

	return stringifyErrorDetail(data);
}

export function getAxiosTestError(error: unknown): Error {
	if (!axios.isAxiosError(error)) {
		return error instanceof Error ? error : new Error(String(error));
	}

	const axiosError = error as AxiosError;
	const status = axiosError.response?.status;
	const method = axiosError.config?.method?.toUpperCase();
	const url = axiosError.config?.url;
	const detail = [method, url, status ? `status ${status}` : axiosError.code].filter(Boolean).join(" ");
	const responseMessage = getResponseMessage(axiosError.response?.data);
	const message = [axiosError.message, detail ? `(${detail})` : undefined, responseMessage ? `response: ${responseMessage}` : undefined].filter(Boolean).join(" ");

	if (responseMessage) {
		console.error(`Axios response message${detail ? ` (${detail})` : ""}: ${responseMessage}`);
	}

	return new Error(message || String(error));
}

export async function axiosTestRequest<T>(request: Promise<T>): Promise<T> {
	try {
		return await request;
	} catch (error) {
		throw getAxiosTestError(error);
	}
}

export async function requestStatus(url: string, token?: string) {
	// Expected 4xx responses are assertions; do not throw Axios' circular error objects.
	return axiosTestRequest(axios({
		method: 'get',
		url,
		headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
		validateStatus: () => true,
	}));
}
