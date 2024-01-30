export function getTime(time: number, entry?: Models.IEntry): Models.ITime {
	const now = new Date();
	const created = Number(time);
	const recieved = now.getTime();
	const uploadDuration = recieved - created;
	const createdString = now.toLocaleString("de-DE", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const diff = entry ? created - entry.time.created : -1;

	return {
		created: created,
		recieved: recieved,
		uploadDuration: uploadDuration,
		diff: diff,
		createdString: createdString
	}
}