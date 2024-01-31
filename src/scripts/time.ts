import logger from '@src/scripts/logger';

export function getTime(time: number, entry?: Models.IEntry): Models.ITime {
	const now = new Date();
	const created = Number(time);
	const recieved = now.getTime();
	const uploadDuration = (recieved - created) / 1000;
	const createdString = now.toLocaleString("de-DE", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: '2-digit',
		hour12: false,
		minute: '2-digit',
		second: '2-digit'
	});
	const diff = entry ? (created - entry.time.created) / 1000 : undefined;

	if (uploadDuration < 0) {
		logger.error(`upload Duration is negative: ${createdString}, index: ${entry ? entry.index + 1 : 0}`);
	}
	if (entry && entry.time.created > created) { // maybe this could happend due to the async nature, but due to uncertainty logging is enabled
		logger.error(`previous timestamp is more recent: ${createdString}, index: ${entry?.index + 1}`);
	}

	return {
		created: created,
		recieved: recieved,
		uploadDuration: uploadDuration,
		diff: diff,
		createdString: createdString
	}
}