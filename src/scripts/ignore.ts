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
    threshold += Math.min(lastEntryDiff / 120, maxThreshold);
  }

  return lastEntry.hdop > threshold; // shall ignore ?
}