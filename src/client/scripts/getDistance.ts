export const getDistance = function getDistance(cleanEntries: Models.IEntry[], stopPoint?: number) {
  if (!stopPoint) {
    stopPoint = cleanEntries.length;
  }
  return cleanEntries.slice(0, stopPoint).reduce((accumulatorValue: number, entry) => {
    if (!entry.distance ||
      (entry.time.diff && entry.time.diff > 60 * 60 * 1000)) { // more than an hour
      return accumulatorValue
    }

    return accumulatorValue + entry.distance.horizontal;
  }, 0) / 1000;
}