import { Request, Response, NextFunction } from 'express';
import { rateLimit, Options as rateLimiterOptions } from 'express-rate-limit';
import { slowDown, Options as slowDownOptions } from 'express-slow-down';
import logger from '@src/scripts/logger';

const ipsThatReachedLimit: RateLimit.obj = {}; // prevent logs from flooding

/* 
** configurations
*/
const baseOptions: Partial<rateLimiterOptions & slowDownOptions> = {
  windowMs: 3 * 60 * 1000,
  skip: (req, res) => (res.locals.ip == "127.0.0.1" || res.locals.ip == "::1")
}

const baseSlowDownOptions: Partial<slowDownOptions> = {
  ...baseOptions,
  delayAfter: 3, // no delay for amount of attempts
  delayMs: (used: number) => (used - 3) * 125, // Add delay after delayAfter is reached
}

const baseRateLimitOptions: Partial<rateLimiterOptions> = {
  ...baseOptions,
  limit: 50, // Limit each IP per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: function rateHandler(req: Request, res: Response, next: NextFunction, options: rateLimiterOptions) {
    if (!Object.prototype.hasOwnProperty.call(ipsThatReachedLimit, res.locals.ip)) {
      logger.error(`[RateLimit] reached ${req.originalUrl}, ${res.locals.ip}, ${req.get('User-Agent')}`);
      ipsThatReachedLimit[res.locals.ip] = { limitReachedOnError: true, time: Date.now() };
    }
    res.status(options.statusCode).send(options.message);
  },
  message: "Too many requests"
}



/*
** exported section
*/
export const baseSlowDown = slowDown(baseSlowDownOptions);

export const loginSlowDown = slowDown({
  ...baseSlowDownOptions,
  delayAfter: 1, // no delay for amount of attempts
  delayMs: (used: number) => (used - 1) * 250, // Add delay after delayAfter is reached
});

export const baseRateLimiter = rateLimit(baseRateLimitOptions);

export const errorRateLimiter = rateLimit({
  ...baseRateLimitOptions,
  message: 'Too many requests with errors',
});

export const loginLimiter = rateLimit({
  ...baseRateLimitOptions,
  limit: 3,
  message: 'Too many attempts without valid login',
});


export function cleanup() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const ip in ipsThatReachedLimit) {
    if (ipsThatReachedLimit[ip].time < oneHourAgo) {
      delete ipsThatReachedLimit[ip];
    }
  }
}