import express, { Request, Response, NextFunction } from 'express';
import { entry } from '@src/models/entry';
import { validationResult } from 'express-validator';
import { create as createError } from '@src/middleware/error';
import { baseSlowDown, errorRateLimiter } from '@src/middleware/limit';

// example call: /write?user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0&eta=1704064000000&eda=1000

function errorChecking(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // if errors happend, then rateLimit to prevent key bruteforcing
    errorRateLimiter(req, res, () => {
      const errorAsJson = { errors: errors.array() };
      const errorAsString = JSON.stringify(errorAsJson);
      const hasKeyErrors = errors.array().some(error => error.msg.includes("Key"));

      // send forbidden or unprocessable content
      return createError(res, hasKeyErrors ? 403 : 422, errorAsString, next)
    });

    return;
  }

  if (req.method == "HEAD") {
    res.status(200).end();
    return;
  }

  next();
}

async function writeData(req: Request, res: Response, next: NextFunction) {
  // Regular Save logic from here    
  await entry.create(req, res, next);

  if (!res.locals.error) {
    res.send(req.query);
  } else {
    next();
  }
}


const router = express.Router();
router.get('/', baseSlowDown, entry.validate, errorChecking, writeData);
router.head('/', baseSlowDown, entry.validate, errorChecking);

export default router;