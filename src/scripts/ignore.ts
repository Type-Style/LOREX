export function getIgnore(lastEntry: Models.IEntry, entry: Models.IEntry): boolean {
  let threshold = 6; // hdop not allowed to be higher
  const maxThreshold = 25;

  const timing = Math.max(lastEntry.time.diff, entry.time.diff)

  // Threshold increases with older previous entries
  if (timing > 32) {
    threshold += Math.min(lastEntry.time.diff / 60, maxThreshold);
  }
  
  return lastEntry.hdop > threshold;
}