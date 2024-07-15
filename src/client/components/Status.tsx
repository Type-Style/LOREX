import React from 'react'
import * as css from "../css/status.module.css";

function Map({ entries }: { entries: Models.IEntry[] }) {
	if(!entries?.length) {
		return <span className="noData cut">No Data to be displayed</span>
	}
	//const lastEntry = entries.at(-1);


	return (
		<span>Status!</span>
	)
}

export default Map
