import { NextFunction, Request, Response } from 'express';
import { checkExact, query } from 'express-validator';
import { create as createError } from '@src/middleware/error';
import * as file from '@src/scripts/file';
import { getTime } from '@src/scripts/time';
import { getSpeed } from '@src/scripts/speed';
import { getDistance } from '@src/scripts/distance';
import { getAngle } from '@src/scripts/angle';
import { getIgnore } from '@src/scripts/ignore';
import logger from '@src/scripts/logger';
import { getAddressData } from "@src/scripts/getAddressData";
import { getPath, updateWithPathData } from "@src/scripts/getPath";

/*
  This variable is used for race conditions
  It contains the timestamp when the file was last written to.
  In case another request is faster than the previous one, the slower one will be ignored.
*/
let lastWrittenToFile = 0;

export const entry = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    const fileObj: File.Obj = file.getFile(res, next, "write");
    if (!fileObj.content) { return createError(res, 500, "File does not exist: " + fileObj.path, next); }

    fileObj.content = await file.readAsJson(res, fileObj.path, next);

    if (!fileObj.content?.entries) { return createError(res, 500, "File Content unavailable: " + fileObj.path, next); }
    /* </guards> */

    lastWrittenToFile = file.getModificationDate(fileObj.path);;

    const entries = fileObj.content.entries;
    const lastEntry = fileObj.content.entries.at(-1);
    let previousEntry = fileObj.content.entries.at(-1); // potentially overwritten if entry is set to ignore
    const entry = {} as Models.IEntry;

    entry.altitude = Number(req.query.altitude);
    entry.hdop = Number(req.query.hdop);
    entry.heading = Number(req.query.heading);
    entry.index = entries.length;
    entry.lat = Number(req.query.lat);
    entry.lon = Number(req.query.lon);
    entry.user = req.query.user as string;
    entry.ignore = false;
    entry.eta = req.query.eta ? Number(req.query.eta) : undefined
    entry.eda = req.query.eda ? Number(req.query.eda) : undefined;

    if (lastEntry && previousEntry) {
      entry.time = getTime(Number(req.query.timestamp), lastEntry); // time data is needed for ignore calculation

      lastEntry.ignore = getIgnore(lastEntry, entry, Number(req.query.speed));

      if (lastEntry.ignore) { // rectify or replace previousEntry with last non ignored element
        for (let i = entries.length - 1; i >= 0; i--) {
          if (!entries[i].ignore) {
            previousEntry = entries[i];
            break;
          }
        }
      }

      entry.time = getTime(Number(req.query.timestamp), previousEntry); // overwrite time in case previousEnty was changed
      entry.angle = getAngle(previousEntry, entry);
      entry.distance = getDistance(entry, previousEntry)
      entry.speed = getSpeed(Number(req.query.speed), entry);

    } else {
      entry.angle = undefined;
      entry.time = getTime(Number(req.query.timestamp));
      entry.speed = getSpeed(Number(req.query.speed))
    }

    const [addressData, pathData] = await Promise.all([
      getAddressData(entry.lat, entry.lon),
      previousEntry ? getPath(previousEntry, entry) : Promise.resolve(null)
    ]);

    const { address, maxSpeed } = addressData;

    entry.address = address;
    if (maxSpeed) {
      entry.speed.maxSpeed = maxSpeed;
    }

    if (pathData) {
      updateWithPathData(entry, pathData);
    }

    // limit max file-size
    if (entries.length < 1000) {
      entries.push(entry);
    } else {
      logger.log(`File over 1000 lines: ${fileObj.path}`);
      if (entry.hdop < 12 || (previousEntry && entry.hdop < previousEntry.hdop)) {
        entries[entries.length - 1] = entry; // replace last entry
      }
    }

    // write to file only if timestamp has of file has not changed since request was incoming
    if (lastWrittenToFile == file.getModificationDate(fileObj.path)) {
      file.write(res, fileObj, next);
    } else {
      logger.error(`⏰ File modified while request was incoming, index: ${entry.index} ${fileObj.path}`);
    }

  },
  validate: [
    query('user').isLength({ min: 2, max: 2 }),
    query('lat').custom(checkNumber(-90, 90)),
    query('lon').custom(checkNumber(-180, 180)),
    query('timestamp').custom((value) => checkTime(value)),
    query('hdop').custom(checkNumber(0, 500)),
    query('altitude').custom(checkNumber(-200, 10000)),
    query('speed').custom(checkNumber(0, 300)),
    query('heading').custom(checkNumber(0, 360, "integer")),
    query('eta').optional().custom((value) => checkTime(value, { allowZero: true })),
    query('eda').optional().custom(checkNumber(0, 10000000)),
    query("key").custom(checkKey),
    checkExact()
    // INFO: if message or any string gets added remember to escape
  ]
}

export function checkNumber(min: number, max: number, type: string = "float") {
  return (value: string) => {
    if (!value) {
      throw new Error('is required');
    }
    if (value.length > 12) {
      throw new Error('Should have a maximum of 11 digits');
    }

    const number = type == "float" ? parseFloat(value) : parseInt(value);
    if (isNaN(number) || number < min || number > max) {
      throw new Error(`Value should be between ${min} and ${max}`);
    }
    return true;
  };
}

export function checkTime(value: string, { allowZero = false } = {}) {
  const timestamp = parseFloat(value);
  if (allowZero && value === '0') { return true; }

  // Check if it's a number
  if (isNaN(timestamp)) {
    throw new Error('Timestamp should be a number');
  }

  // Check if it's a valid date
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error('Timestamp should represent a valid date');
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  if (Math.abs(difference) >= oneDayInMilliseconds) {
    throw new Error('Timestamp should represent a date not further from server time than 1 day');
  }

  return true
}


async function checkKey(value: string) {
  if (!value) { throw new Error('Key required'); }
  if (!process.env.KEY) { throw new Error('Configuration wrong: KEY is missing in environment variables'); }
  if (process.env.NODE_ENV != "production" && value == "test") {
    return true; // dev testing convenience 
  }

  const result = Buffer.from(encodeURIComponent(value)).toString('base64') == process.env.KEY;

  if (!result) {
    throw new Error('Key does not match');
  }

  return true;
}
