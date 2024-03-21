import { checkNumber, checkTime } from "../models/entry";


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
