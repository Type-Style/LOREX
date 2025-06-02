import { useContext } from "react";
import { ActionContext, Context } from "../context";
import axios, { AxiosResponse } from "axios";
import e from "express";

export const useGetData = (index: number, fetchIntervalMs: number, setEntries) => {
	const [contextObj] = useContext(Context);

	const fetchData = async function () {
		const token = localStorage.getItem("jwt");
		let response: AxiosResponse<Models.IEntries>;

		let returnObj: client.entryData = { isError: false, status: 200, message: "", fetchTimeData: { last: null, next: null } }

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
	const setEntries = actionContext.setEntries;
	const entries = actionContext.entries;

	const ignoreData = (index: number, direction?: "before" | "after"): boolean => {
		const entryWithIndex = entries.find(entry => entry.index === index);
		if (!entryWithIndex) {
			return false;
		}

		const entryIndex = entries.indexOf(entryWithIndex);

		if (entryIndex === -1) {
			return false;
		}
	
		if (direction === undefined) { // ignore the entry (self)
			setEntries(entries.filter((_, i) => i !== entryIndex));
			return true;
		}
	
		if (direction === "before") {
			setEntries(entries.slice(entryIndex));
			return true;
		}
	
		if (direction === "after") {
			setEntries(entries.slice(0, entryIndex + 1));
			return true;
		}

		return false;
	}

	return { ignoreData };
	
}
