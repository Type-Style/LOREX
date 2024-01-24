import { Request, Response} from 'express';
import { checkExact, query } from 'express-validator';
import { crypt } from '@src/scripts/crypt';

export const entry = {
	create: (req:Request, res:Response) => {
		console.log(req.query);
		console.log(res);
	},
	validate: [
		query('user').isLength({ min: 2, max: 2 }),
		query('lat').custom(checkNumber(-90, 90)),
		query('lon').custom(checkNumber(-180, 180)),
		query('timestamp').custom(checkTime),
		query('hdop').custom(checkNumber(0, 100)),
		query('altitude').custom(checkNumber(0, 10000)),
		query('speed').custom(checkNumber(0, 300)),
		query('heading').custom(checkNumber(0, 360)),
    query("key").custom(checkKey),
		checkExact()
    // INFO: if message or any string gets added remember to escape
	]
}

export function checkNumber(min:number, max:number) {
	return (value:string) => {
    if (!value) {
      throw new Error('is required');
    }
		if (value.length > 12) {
			throw new Error('Should have a maximum of 11 digits');
		}
		
    const number = parseFloat(value);
    if (isNaN(number) || number < min || number > max) {
      throw new Error(`Value should be between ${min} and ${max}`);
    }
    return true;
  };	
}

export function checkTime(value:string) {
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

async function checkKey(value:string) {
  /* if (process.env.NODE_ENV != "production") {
    return true; // dev testing convenience 
  } */

  const myEncryptPassword = await crypt.cryptPassword(value);
  console.log("key "  + process.env.KEY + " - " + myEncryptPassword);

  if (process.env.KEY != myEncryptPassword) {
    throw new Error('Key does not match');
  }

  return true;
}