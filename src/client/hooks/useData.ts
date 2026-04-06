import { useContext } from "react";
import { ActionContext, Context } from "../context";
import axios, { AxiosResponse } from "axios";

export const useGetData = (index: number, fetchIntervalMs: number, setEntries) => {
	const [contextObj] = useContext(Context);

	const fetchData = async function () {
		const token = localStorage.getItem("jwt");
		let response: AxiosResponse<Models.IEntries>;

		const returnObj: client.entryData = { isError: false, status: 200, message: "", fetchTimeData: { last: null, next: null } }

		if (!token) {
			contextObj.setLogin(false);
			return { ...returnObj, isError: true, status: 403, message: "No valid login" };
		}

		try {
			const startTime = Date.now();

			response = await axios<Models.IEntries>({
				method: 'get',
				url: "/read?index=" + (Math.max(index - 1, 0)) + "&noCache=" + startTime,
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const newEntries: Array<Models.IEntry> = response.data.entries;

			if (newEntries.length) {
				setEntries((prevEntries: Array<Models.IEntry>) => {
					let allButLastPrevEntries: Array<Models.IEntry>, mergedEntries: Array<Models.IEntry> = [];

					if (prevEntries.length) {
						allButLastPrevEntries = prevEntries.slice(0, prevEntries.length - 1);
						mergedEntries = [...allButLastPrevEntries, ...newEntries];
					} else {
						mergedEntries = newEntries;
					}

					return mergedEntries;
				});

			}

			const endTime = Date.now();
			const delay = endTime - startTime;

			returnObj.fetchTimeData.last = endTime;
			returnObj.fetchTimeData.next = endTime + fetchIntervalMs + delay;

			return returnObj;

		} catch (error) {
			console.log("error fetching data %o", error);
			returnObj.isError = true;

			if (!error.response) {
				return { ...returnObj, status: 499, message: error.message || "offline", fetchTimeData: { last: new Date().getTime(), next: new Date().getTime() + fetchIntervalMs } }
			}

			if (error.response.status == 403 || error.response.status == 401) {
				contextObj.setLogin(false);
				return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message, fetchTimeData: { last: null, next: null } }
			}

			contextObj.setLogin(true);
			return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message, fetchTimeData: { last: null, next: null } }
		}
	}

	return { fetchData }

};




export const useIgnoreData = () => {
	const [actionContext] = useContext(ActionContext);
	const [contextObj] = useContext(Context);

	const setEntries = actionContext.setEntries;

	const ignoreData = async (index: number, direction?: "before" | "after"): Promise<Omit<client.entryData, 'fetchTimeData'>> => {
		const returnObj: Omit<client.entryData, 'fetchTimeData'> = { isError: false, status: 200, message: "" };
		const token = localStorage.getItem("jwt");

		const url = "/read/ignore?index=" + index + (direction ? "&direction=" + direction : "");

		try {
			const response = await axios<Models.IEntries>({
				method: 'get',
				url,
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			setEntries(response.data.entries);

			return returnObj;

		} catch (error) {
			console.log("error fetching data %o", error);
			returnObj.isError = true;

			if (!error.response) {
				return { ...returnObj, status: 499, message: error.message || "offline" }
			}

			if (error.response.status == 403 || error.response.status == 401) {
				contextObj.setLogin(false);
				return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message }
			}

			contextObj.setLogin(true);
			return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message }
		}
	}

	const resetData = async (): Promise<Omit<client.entryData, 'fetchTimeData'>> => {
		const returnObj: Omit<client.entryData, 'fetchTimeData'> = { isError: false, status: 200, message: "" };
		const token = localStorage.getItem("jwt");

		try {
			const response = await axios<Models.IEntries>({
				method: 'get',
				url: "/read?index=0",
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			setEntries(response.data.entries);

			return returnObj;

		} catch (error) {
			console.log("error fetching data %o", error);
			returnObj.isError = true;

			if (!error.response) {
				return { ...returnObj, status: 499, message: error.message || "offline" }
			}

			if (error.response.status == 403 || error.response.status == 401) {
				contextObj.setLogin(false);
				return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message }
			}

			contextObj.setLogin(true);
			return { ...returnObj, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message }
		}
	}

	return { ignoreData, resetData };

}
