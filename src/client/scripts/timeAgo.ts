export function timeAgo(timestamp: number): string {
	if (!Number.isInteger(timestamp)) { return ""; }
 
	const now = Date.now();
	const diffInSeconds = Math.floor((now - timestamp) / 1000);

	const seconds = diffInSeconds;
	const minutes = Math.round(diffInSeconds / 60);
	const hours = Math.round(diffInSeconds / 3600);
	const days = Math.round(diffInSeconds / 86400);
	const months = Math.round(diffInSeconds / 2592000);
	const years = Math.round(diffInSeconds / 31536000);

	if (seconds < 8) return "Instant";
	if (seconds < 25) return "Just now";
	if (seconds < 50) return "a moment ago";
	if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
	if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
	if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

	return `${years} ${years === 1 ? "year" : "years"} ago`;
}