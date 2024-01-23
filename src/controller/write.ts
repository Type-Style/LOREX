import express, { Request, Response, NextFunction } from 'express';
import { entry } from '@src/models/entry';
import { validationResult } from 'express-validator';
import logger from '@src/scripts/logger';

// example call: /write?&user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0
function errorChecking (req:Request, res:Response, next:NextFunction) {
  console.log("method: %o", req.method);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorAsJson = { errors: errors.array()};
    const errorAsString = new Error(JSON.stringify(errorAsJson));
    res.status(422);
    return next(errorAsString);
  }

  //entry.create(req, res);
  //const test = process.env.TEST;

  //res.send(req.query);
}


const router = express.Router();
router.use(entry.validate);

router.get('/', errorChecking);
router.head('/', errorChecking);

export default router;