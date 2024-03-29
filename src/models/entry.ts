import { NextFunction, Request, Response } from 'express';
import { checkExact, query } from 'express-validator';
import { compare } from '@src/scripts/crypt';
import { create as createError } from '@src/middleware/error';
import * as file from '@src/scripts/file';
import { getTime } from '@src/scripts/time';
import { getSpeed } from '@src/scripts/speed';
import { getDistance } from '@src/scripts/distance';
import { getAngle } from '@src/scripts/angle';
import { getIgnore } from '@src/scripts/ignore';
import logger from '@src/scripts/logger';


export const entry = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    const fileObj: File.Obj = file.getFile(res, next);
    fileObj.content = await file.readAsJson(res, fileObj.path, next);

    if (!fileObj.content?.entries) {
      return createError(res, 500, "File Content unavailable: " + fileObj.path, next);
    }
    const entries = fileObj.content.entries;
    const lastEntry = fileObj.content.entries.at(-1);
    const entry = {} as Models.IEntry;

    entry.altitude = Number(req.query.altitude);
    entry.hdop = Number(req.query.hdop);
    entry.heading = Number(req.query.heading);
    entry.index = entries.length;
    entry.lat = Number(req.query.lat);
    entry.lon = Number(req.query.lon);
    entry.user = req.query.user as string;
    entry.ignore = false;

    if (lastEntry) { // so there is a previous entry
      entry.time = getTime(Number(req.query.timestamp), lastEntry);
      lastEntry.ignore = getIgnore(lastEntry, entry);
      entry.angle = getAngle(lastEntry, entry);
      entry.distance = getDistance(entry, lastEntry)
      entry.speed = getSpeed(Number(req.query.speed), entry);
    } else {
      entry.angle = undefined;
      entry.time = getTime(Number(req.query.timestamp));
      entry.speed = getSpeed(Number(req.query.speed))
    }

    if (entries.length >= 1000) {
      logger.log(`File over 1000 lines: ${fileObj.path}`);
      if (entry.hdop < 12 || (lastEntry && entry.hdop < lastEntry.hdop)) {
        entries[entries.length - 1] = entry; // replace last entry
      }
    } else {
      entries.push(entry);
    }

    file.write(res, fileObj, next);

  },
  validate: [
    query('user').isLength({ min: 2, max: 2 }),
    query('lat').custom(checkNumber(-90, 90)),
    query('lon').custom(checkNumber(-180, 180)),
    query('timestamp').custom(checkTime),
    query('hdop').custom(checkNumber(0, 100)),
    query('altitude').custom(checkNumber(0, 10000)),
    query('speed').custom(checkNumber(0, 300)),
    query('heading').custom(checkNumber(0, 360, "integer")),
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

export function checkTime(value: string) {
  const timestamp = parseFloat(value);

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
  if (!process.env.KEYB) { throw new Error('Configuration wrong'); }
  if (process.env.NODE_ENV != "production" && value == "test") {
    return true; // dev testing convenience 
  }

  const result = await compare(decodeURIComponent(value), process.env.KEYB);

  if (!result) {
    throw new Error('Key does not match');
  }

  return true;
}
