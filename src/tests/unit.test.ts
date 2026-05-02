import { checkNumber, checkTime } from "../models/entry";
import toFixedNumber from "../scripts/toFixedNumber";
import { checkPreconditions, reorderCoordinates } from "../scripts/getPath";
import { getIgnoreClose } from "../scripts/ignore";


describe("entry checkNumber", () => {
  it("should throw error if value is not provided", () => {
    expect(() => checkNumber(0, 100)("")).toThrow(new Error('is required'));
  });

  it("should throw error if value length is more than 12", () => {
    expect(() => checkNumber(0, 100)("1234567890123")).toThrow(new Error('Should have a maximum of 11 digits'));
  });

  it("should throw error if value is not a number", () => {
    expect(() => checkNumber(0, 100)("abc")).toThrow(new Error('Value should be between 0 and 100'));
  });

  it("should return true if value is a valid number within range", () => {
    expect(checkNumber(0, 100)("50")).toBe(true);
  });
});

describe("entry checkTime", () => {
  it("should throw error if value is not a number", () => {
    expect(() => checkTime("abc")).toThrow(new Error('Timestamp should be a number'));
  });

  it("should throw error if value is not a valid date", () => {
    expect(() => checkTime("99999999999999999999")).toThrow(new Error('Timestamp should represent a valid date'));
  });

  it("should throw error if value is more than 1 day in the past", () => {
    const date = new Date();
    date.setDate(date.getDate() - 2); // Set date to 2 days ago
    expect(() => checkTime(date.getTime().toString())).toThrow(new Error('Timestamp should represent a date not further from server time than 1 day'));
  });

  it("should throw error if value is more than 1 day in the future", () => {
    const date = new Date();
    date.setDate(date.getDate() + 2); // Set date to 2 days in the future
    expect(() => checkTime(date.getTime().toString())).toThrow(new Error('Timestamp should represent a date not further from server time than 1 day'));
  });

  it("should return true if value is a valid timestamp within 1 day", () => {
    const date = new Date();
    expect(checkTime(date.getTime().toString())).toBe(true);
  });
});

describe("toFixedNumber", () => {
  it("should return a valid number", () => {
    expect(toFixedNumber(1.23456789, 2)).toEqual(1.23);
  });
});

describe("reorderCoordinates", () => {
  it("switches numbers correctly", () => {
    expect(reorderCoordinates([[2, 1], [4, 3] ])).toEqual([[1, 2], [3, 4]]);
  });
});

describe("getPath", () => {
  it("check condition function", () => {
    const baseEntry = {
      "altitude": 0,
      "hdop": 1,
      "heading": 0,
      "index": 0,
      "lat": 0,
      "lon": 0,
      "user": "MS",
      "ignore": false,
      "eta": 0,
      "eda": 0,
      "time": {
        "created": 0,
        "recieved": 0,
        "uploadDuration": 0,
        "diff": 30,
        "createdString": "00:00"
      },
      "angle": 0,
      "distance": {
        "horizontal": 0,
        "vertical": 0,
        "total": 0
      },
      "speed": {
        "gps": 0,
        "horizontal": 0,
        "vertical": 0,
        "total": 1,
        "maxSpeed": 0
      },
      "address": "nowhere"
    }

    let lastEntry = {
      ...baseEntry,
      "heading": 0,
      "ignore": false
    };

   let entry = {
      ...baseEntry,
      "angle": 20,
      "heading": 20,
      "distance": {
        ...baseEntry.distance,
        "horizontal": 200,
        "total": 200,
        "vertical": 0
      },
      "speed": {
        ...baseEntry.speed,
        "gps": 33,
        "total": 33,
      }
    };

    const result = checkPreconditions(lastEntry, baseEntry);
    expect(typeof result).toBe("boolean");
    expect(result).toBe(false);

    const result2 = checkPreconditions(lastEntry, entry);
    expect(result2).toBe(true);
  });
});

describe("getIgnoreClose", () => {
  /*
    At lat=50, a latitude offset of 0.00009 deg is ~10 m, 0.00018 deg is
    ~20 m, 0.0002 deg is ~22 m, 0.00027 deg is ~30 m (haversine).
    Threshold for each leg = CLOSE_M (20) + hdop_of_from_entry, strict <.
    For dist(entry, prev): entry.hdop. For dist(prev, prevPrev): prev.hdop.
  */
  const baseEntry: Models.IEntry = {
    altitude: 0,
    hdop: 1,
    heading: 0,
    index: 0,
    lat: 50,
    lon: 8,
    user: "MS",
    ignore: false,
    eta: 0,
    eda: 0,
    time: { created: 0, recieved: 0, uploadDuration: 0, diff: 30, createdString: "00:00" },
    angle: 0,
    distance: { horizontal: 0, vertical: 0, total: 0 },
    speed: { gps: 0, horizontal: 0, vertical: 0, total: 0, maxSpeed: 0 },
    address: ""
  };

  const at = (lat: number, hdop = 1): Models.IEntry => ({ ...baseEntry, lat, hdop });

  it("returns false when prevPrev is undefined", () => {
    expect(getIgnoreClose(undefined, at(50.00009), at(50.00018))).toBe(false);
  });

  it("returns true when all three are within ~10m and hdop=1", () => {
    expect(getIgnoreClose(at(50), at(50.00009), at(50.00018))).toBe(true);
  });

  it("returns true for identical coordinates", () => {
    expect(getIgnoreClose(at(50), at(50), at(50))).toBe(true);
  });

  it("returns false when current↔prev distance is too large", () => {
    // dist1 ~30m > 21 (20 + hdop 1)
    expect(getIgnoreClose(at(50), at(50.00009), at(50.00036))).toBe(false);
  });

  it("returns false when prev↔prevPrev distance is too large", () => {
    // dist2 ~30m > 21
    expect(getIgnoreClose(at(50), at(50.00027), at(50.00036))).toBe(false);
  });

  it("entry.hdop only widens the entry↔prev leg, not the prev↔prevPrev leg", () => {
    // both legs ~22m. entry.hdop=5 (threshold 25 for dist1 ✓), but prev.hdop=1
    // (threshold 21 for dist2, 22.02 NOT < 21 ✗) → overall false.
    expect(getIgnoreClose(at(50), at(50.0002), at(50.0004, 5))).toBe(false);
  });

  it("prev.hdop widens the prev↔prevPrev leg", () => {
    // both legs ~22m. prev.hdop=5 (threshold 25 for dist2 ✓) and entry.hdop=5
    // (threshold 25 for dist1 ✓) → true.
    expect(getIgnoreClose(at(50), at(50.0002, 5), at(50.0004, 5))).toBe(true);
  });

  it("strict <: distance equal to threshold does not trigger", () => {
    // dist1 ~22m, entry.hdop=2 → threshold 22, 22.02 NOT < 22 → false
    expect(getIgnoreClose(at(50), at(50.0002), at(50.0004, 2))).toBe(false);
  });
});