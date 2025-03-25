import { checkNumber, checkTime } from "../models/entry";
import toFixedNumber from "../scripts/toFixedNumber";
import { checkPreconditions, reorderCoordinates } from "../scripts/getPath";


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
      "heading": 20,
      "distance": {
        ...baseEntry.distance,
        "horizontal": 200,
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