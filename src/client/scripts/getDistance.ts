export const getDistance = function getDistance(cleanEntries: Models.IEntry[], stopPoint?: number, ignorePause: boolean = false) {
  if (stopPoint === undefined) {
    stopPoint = cleanEntries.length;
  }
  if (stopPoint != cleanEntries.length) {
    stopPoint++; // slicing start 0 and end 1 only return 1 item, same as 0 and 0
  }

  return cleanEntries.slice(0, stopPoint).reduce((accumulatorValue: number, entry) => {
    if (!entry.distance ||
       (ignorePause && entry.time.diff && entry.time.diff >= 600)) { 
      return accumulatorValue
    }

    return accumulatorValue + entry.distance.horizontal;
  }, 0) / 1000;
}