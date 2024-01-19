import { kMaxLength } from 'buffer';
import { Request, Response, NextFunction } from 'express';
import { query } from 'express-validator';

const entry = {
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
		// TODO altitude, speed, heading
	]

}

function checkNumber(min:number, max:number) {
	return (value:string) => {
		if (value.length > 11) {
			throw new Error('Should have a maximum of 11 digits');
		}
		
    const number = parseFloat(value);
    if (isNaN(number) || number < min || number > max) {
      throw new Error(`Value should be between ${min} and ${max}`);
    }
    return true;
  };	
}

function checkTime(value:string) {
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

  return true;
}

export default entry;