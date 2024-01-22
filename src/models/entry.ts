import { Request, Response} from 'express';
import { checkExact, query } from 'express-validator';

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
		query('altitude').custom(checkNumber(0, 10000)),
		query('speed').custom(checkNumber(0, 300)),
		query('heading').custom(checkNumber(0, 360)),
		checkExact()
    // INFO: if message or any string gets added remember to escape
	]

}

function checkNumber(min:number, max:number) {
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