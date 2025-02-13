export function getIgnore(lastEntry: Models.IEntry, entry: Models.IEntry): boolean {
  let threshold = 6; // hdop not allowed to be higher
  const maxThreshold = 25;
  const lastEntryDiff = lastEntry.time.diff || 0;
  const timing = Math.max(lastEntryDiff, entry.time.diff || 0);

  // Threshold increases with older previous entries
  if (timing > 32) {
    threshold += Math.min(lastEntryDiff / 60, maxThreshold);
  }
  
  return lastEntry.hdop > threshold;
}