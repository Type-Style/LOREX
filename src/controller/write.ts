import express, { Request, Response, NextFunction } from 'express';
import { entry } from '@src/models/entry';
import { validationResult } from 'express-validator';

// example call: /write?user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0
function errorChecking (req:Request, res:Response, next:NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorAsJson = { errors: errors.array()};
    const errorAsString = new Error(JSON.stringify(errorAsJson));
    const hasKeyErrors =  errors.array().some(error => error.msg.includes("Key"));
   
    res.status(hasKeyErrors ? 403 : 422); // send forbidden or unprocessable content
    return next(errorAsString);
  }

  if (req.method == "HEAD") {
    res.status(200).end();
    return;
  }

  // Regular Save logic from here
    
    //entry.create(req, res);
    //const test = process.env.TEST;
   // res.send(req.query);
  
}


const router = express.Router();
router.use(entry.validate);

router.get('/', errorChecking);
router.head('/', errorChecking);

export default router;