import { useMemo } from "react";

// Used to recenter the map to new coordinates
export const MapHideSmallCluster = () => {
	useMemo(() => {
		const observer = new MutationObserver(() => {
			let clusters = document.querySelectorAll(".marker-cluster");
			if (clusters?.length) {
				clusters.forEach(cluster => {
					const span = cluster.querySelector("span");
					if (span) {
						if (parseInt(span.innerText) == 2) {
							cluster.classList.add("hide");
						}
					}
				});
			}
		});
		const config = {
			childList: true,
			subtree: true
		};
		const mapContainer = document.querySelector(".mapContainer");
		observer.observe(mapContainer!, config);
	}, []);
	
	return null
};