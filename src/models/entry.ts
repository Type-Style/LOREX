import { NextFunction, Request, Response } from 'express';
import { checkExact, query } from 'express-validator';
import { crypt } from '@src/scripts/crypt';
import { create as createError } from '@src/error';
import * as file from '@src/scripts/file';
import { getTime } from '@src/scripts/time';
import { getSpeed } from '@src/scripts/speed';


export const entry = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    const fileObj: File.Obj = file.getFile(res, next);
    fileObj.content = await file.readAsJson(res, fileObj.path, next);

    if (!fileObj.content?.entries) {
      return createError(res, 500, "File Content unavailable: " + fileObj.path, next);
    }
    const entries = fileObj.content.entries;
    const entry = {} as Models.IEntry;

    entry.altitude = Number(req.query.altitude);
    entry.hdop = Number(req.query.hdop);
    entry.heading = Number(req.query.heading);
    entry.index = entries.length;
    entry.lat = Number(req.query.lat);
    entry.lon = Number(req.query.lon);
    entry.user = req.query.user as string;
    //entry.speed = getSpeed(Number(req.query.speed))
    if (entries.length) { // so there is a previous entry
      entry.time = getTime(Number(req.query.timestamp), entries.at(-1));
      // checkIgnore()
      // newEntry.angle = getAngle();
      // newEntry.distance = getDistance()
    } else {
      entry.time = getTime(Number(req.query.timestamp));
    }


    entries.push(entry);

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

  if (process.env.NODE_ENV == "development") {
    return true; // dev testing convenience 
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  if (Math.abs(difference) >= oneDayInMilliseconds) {
    throw new Error('Timestamp should represent a date not further from server time than 1 day');
  }

  return true
}

function checkKey(value: string) {
  if (process.env.NODE_ENV != "production" && value == "test") {
    return true; // dev testing convenience 
  }

  if (!value) {
    throw new Error('Key required');
  }

  value = decodeURIComponent(value);

  const hash = crypt(value);

  if (process.env.KEYB != hash) {
    if (process.env.NODE_ENV == "development") {
      console.log(hash);
    }
    throw new Error('Key does not match');
  }

  return true;
}