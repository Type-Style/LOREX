import { useContext, useState } from "react";
import { Context } from "../components/App";
import axios from "axios";

export const useGetData = (index: React.RefObject<number>, fetchIntervalMs: number, setEntries: Function) => {
	const [contextObj] = useContext(Context);


	const fetchData = async function () {
		const token = localStorage.getItem("jwt");
		let response;
		let returnObj: client.entryData = { isError: false, status: 200, message: "", fetchTimeData: { last: null, next: null }}

		if (!token) {
			contextObj.setLogin(false);
			returnObj = { isError: true, status: 403, message: "No valid login", fetchTimeData: null }
			return returnObj;
		}

		try {
			const now = new Date().getTime();
			returnObj.fetchTimeData.last = now;

			response = await axios({
				method: 'get',
				url: "/read?index=" + (Math.max(index.current - 1, 0)) + "&noCache=" + now,
				headers: {
					'Authorization': `Bearer ${token}`
				}
			});

			const newEntries = response.data.entries;

			if (newEntries.length) {
				setEntries((prevEntries) => {
					let allButLastPrevEntries, mergedEntries = [];

					if (prevEntries.length) {
						allButLastPrevEntries = prevEntries.slice(0, prevEntries.length - 1);
						mergedEntries = [...allButLastPrevEntries, ...newEntries];
					} else {
						mergedEntries = newEntries;
					}

					(index as unknown as React.MutableRefObject<number>).current = mergedEntries.length; // typescript blocks reassignment on refs https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065#issuecomment-547327595

					return mergedEntries;
				});

			}

			returnObj = { isError: false, status: 200, message: "", fetchTimeData: { ...returnObj.fetchTimeData, next: new Date().getTime() + fetchIntervalMs } }
			return returnObj;

		} catch (error) {
			console.log("error fetching data %o", error);

			if (!error.response) {
				returnObj = { isError: true, status: 499, message: error.message || "offline", fetchTimeData: { ...returnObj.fetchTimeData, next: new Date().getTime() + fetchIntervalMs } }
				return returnObj;
			}

			if (error.response.status == 403) { contextObj.setLogin(false) }

			returnObj = { isError: true, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message, fetchTimeData: { last: null, next: null } }
			return returnObj;
		}
	}

	return { fetchData }

};