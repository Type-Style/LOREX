import { useContext } from "react";
import { Context } from "../context";
import axios, { AxiosResponse } from "axios";

export const useGetData = (index: number, fetchIntervalMs: number, setEntries) => {
	const [contextObj] = useContext(Context);

	const fetchData = async function () {
		const token = localStorage.getItem("jwt");
		let response: AxiosResponse<Models.IEntries>;

		let returnObj: client.entryData = { isError: false, status: 200, message: "", fetchTimeData: { last: null, next: null }}

		if (!token) {
			contextObj.setLogin(false);
			return { ...returnObj, isError: true, status: 403, message: "No valid login" };
		}

		try {
			const now = new Date().getTime();
			returnObj.fetchTimeData.last = now;

			response = await axios<Models.IEntries>({
				method: 'get',
				url: "/read?index=" + (Math.max(index - 1, 0)) + "&noCache=" + now,
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const newEntries: Array<Models.IEntry> = response.data.entries;

			if (newEntries.length) {
				setEntries((prevEntries:Array<Models.IEntry>) => {
					let allButLastPrevEntries:Array<Models.IEntry>, mergedEntries: Array<Models.IEntry> = [];

					if (prevEntries.length) {
						allButLastPrevEntries = prevEntries.slice(0, prevEntries.length - 1);
						mergedEntries = [...allButLastPrevEntries, ...newEntries];
					} else {
						mergedEntries = newEntries;
					}

					return mergedEntries;
				});

			}

			return{ isError: false, status: 200, message: "", fetchTimeData: { ...returnObj.fetchTimeData, next: new Date().getTime() + fetchIntervalMs } }

		} catch (error) {
			console.log("error fetching data %o", error);

			if (!error.response) {
				return { isError: true, status: 499, message: error.message || "offline", fetchTimeData: { ...returnObj.fetchTimeData, next: new Date().getTime() + fetchIntervalMs } }
			}

			if (error.response.status == 403) { contextObj.setLogin(false) }

			return { isError: true, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message, fetchTimeData: { last: null, next: null } }
		}
	}

	return { fetchData }

};