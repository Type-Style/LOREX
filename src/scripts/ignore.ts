import { getDistance } from '@src/scripts/distance';

const CLOSE_M = 20;

export function getIgnore(lastEntry: Models.IEntry, entry: Models.IEntry, gpsSpeed: number) {
  let threshold = 4.5; // standard threshold
  if (gpsSpeed > 10) { // higher than 10m/s
    threshold += 1; // higher threshold for high speeds
  }
  const maxThreshold = 13 - threshold; // maximum threshold used based on time diff
  const lastEntryDiff = lastEntry.time.diff || 0;
  const timing = Math.max(lastEntryDiff, entry.time.diff || 0);

  // Threshold increases with older previous entries
  if (timing > 32) {
    threshold += Math.min(lastEntryDiff / 60 / 2, maxThreshold);
  }

  return lastEntry.hdop > threshold; // shall ignore ?
}

// True when three non-ignored entries are tightly clustered by consecutive horizontal distance.
export function getIgnoreClose(
  prevPrev: Models.IEntry | undefined,
  prev: Models.IEntry,
  entry: Models.IEntry
): boolean {
  if (!prevPrev) { return false; }
  const dist1_m = getDistance(entry, prev).horizontal;
  const dist2_m = getDistance(prev, prevPrev).horizontal;
  // hdop comes from the entry the distance is calculated FROM (the newer of each pair)
  return dist1_m < CLOSE_M + entry.hdop && dist2_m < CLOSE_M + prev.hdop;
}
