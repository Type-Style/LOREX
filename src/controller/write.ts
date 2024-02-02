import express, { Request, Response, NextFunction } from 'express';
import { entry } from '@src/models/entry';
import { validationResult } from 'express-validator';
import { create as createError } from '@src/error'; 


// example call: /write?user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0
async function errorChecking (req:Request, res:Response, next:NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorAsJson = { errors: errors.array()};
    const errorAsString = JSON.stringify(errorAsJson);
    const hasKeyErrors =  errors.array().some(error => error.msg.includes("Key"));
   
    // send forbidden or unprocessable content
    return createError(res, hasKeyErrors ? 403 : 422, errorAsString, next)
  }

  if (req.method == "HEAD") {
    res.status(200).end();
    return;
  }

  // Regular Save logic from here    
  await entry.create(req, res, next);

  if (!res.locals.error) { 
    res.send(req.query);
  } else { 
    /* at this point error handling already happend,
    *  or the request has already been send
    *  therefor there is no need for it again (only middleware to follow at this point) */
    next();
  }
}


const router = express.Router();
router.get('/', entry.validate, errorChecking);
router.head('/', entry.validate, errorChecking);

export default router;