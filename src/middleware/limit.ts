import { Request, Response, NextFunction } from 'express';
import { rateLimit, Options as rateLimiterOptions } from 'express-rate-limit';
import { slowDown, Options as slowDownOptions } from 'express-slow-down';
import logger from '@src/scripts/logger';


// TODO clean up after 1 day?
const ipsThatReachedLimit: RateLimit.obj = {};

const baseOptions: Partial<rateLimiterOptions & slowDownOptions> = {
  windowMs: 5 * 60 * 1000,
  //skip: (req, res) => (res.locals.ip == process.env.LOCALHOST)
}

const baseSlowDownOptions: Partial<slowDownOptions> = {
  ...baseOptions,
  delayAfter: 3, // no delay for amount of attempts
  delayMs: (used: number) => (used - 3) * 125, // Add delay after delayAfter is reached
}

const baseRateLimitOptions: Partial<rateLimiterOptions> = {
  ...baseOptions,
  limit: 10, // Limit each IP per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}


/*
** exported section
*/
export const baseSlowDown = slowDown(baseSlowDownOptions);

export const errorRateLimiter = rateLimit({
  ...baseRateLimitOptions,
  message: 'Too many requests with errors',
  handler: (req: Request, res: Response, next: NextFunction, options: rateLimiterOptions) => {
    if (!Object.prototype.hasOwnProperty.call(ipsThatReachedLimit, res.locals.ip)) {
      logger.error(`[RateLimit] for invalid requests reached ${res.locals.ip}, ${req.get('User-Agent')}`);
      ipsThatReachedLimit[res.locals.ip] = { limitReachedOnError: true };
    }
    res.status(options.statusCode).send(options.message);
  }
});