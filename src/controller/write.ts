import express, { Request, Response, NextFunction } from 'express';
import { entry } from '@src/models/entry';
import { validationResult } from 'express-validator';
import { create as createError } from '@src/error';
import { slowDown, Options as slowDownOptions } from 'express-slow-down';
import { rateLimit, Options as rateLimiterOptions } from 'express-rate-limit';
import logger from '@src/scripts/logger';

// TODO clean up after 1 day?
// TODO move rateLimit to own file
const ipsThatReachedLimit: RateLimit.obj = {};

const baseOptions: Partial<rateLimiterOptions & slowDownOptions> = {
  windowMs: 5 * 60 * 1000,
  //skip: (req, res) => (res.locals.ip == process.env.LOCALHOST)
}

const baseSlowDown: Partial<slowDownOptions> = {
  ...baseOptions,
  delayAfter: 3, // no delay for amount of attempts
  delayMs: (used: number) => (used - 3) * 125, // Add delay after delayAfter is reached
}

const baseRateLimit: Partial<rateLimiterOptions> = {
  ...baseOptions,
  limit: 10, // Limit each IP per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}

const errorRateLimiter = rateLimit({
  ...baseRateLimit,
  message: 'Too many requests with errors',
  handler: (req: Request, res: Response, next: NextFunction, options: rateLimiterOptions) => {
    if (!Object.prototype.hasOwnProperty.call(ipsThatReachedLimit, res.locals.ip)) {
      logger.error(`[RateLimit] for invalid requests reached ${res.locals.ip}, ${req.get('User-Agent')}`);
      ipsThatReachedLimit[res.locals.ip] = { limitReachedOnError: true };
    }
    res.status(options.statusCode).send(options.message);
  }
});

// function customRateLimit(req: Request, res: Response, next: NextFunction) {
//   console.count("customRateLimit");
//   if (!validationResult(req).isEmpty()) {
    
//   } else {
//     rateLimit({
//       ...baseRateLimit,
//       limit: 20,
//       handler: (req: Request, res: Response, next: NextFunction, options: rateLimiterOptions) => {
//         if (!Object.prototype.hasOwnProperty.call(ipsThatReachedLimit, res.locals.ip)) {
//           logger.error(`[RateLimit] for valid requests reached ${res.locals.ip}, ${req.get('User-Agent')}`);
//           ipsThatReachedLimit[res.locals.ip] = { limitReachedOnError: false };
//         }
//         res.status(options.statusCode).send(options.message);
//       }
//     })
//   }
// }



// example call: /write?user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0

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
router.get('/', slowDown(baseSlowDown), entry.validate, errorChecking, writeData);
router.head('/', slowDown(baseSlowDown), entry.validate, errorChecking);

export default router;