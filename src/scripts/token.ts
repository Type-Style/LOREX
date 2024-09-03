import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { create as createError } from '@src/middleware/error';


const csrfTokens: Set<CSRFToken> = new Set();

export function createCSRF(res: Response, next: NextFunction): string | false {
  if (csrfTokens.size > 100) { // Max Number of Tokens in memory
    res.set('Retry-After', '300'); // 5 minutes
    createError(res, 503, "Too many tokens \n retry after 5 Minuits", next);
    return false;
  }

  const token = crypto.randomBytes(16).toString('hex');
  const expiry = Date.now() + (5 * 60 * 1000); // Token expires in 5 minutes
  const csrfToken: CSRFToken = { token, expiry };
  csrfTokens.add(csrfToken);

  return token;
}

export function validateCSRF(token: string): boolean {
  const currentTime = Date.now();
  let valid: boolean = false;
  for (const entry of csrfTokens) {
    if (entry.token === token) {
      valid = entry.expiry > currentTime;
      csrfTokens.delete(entry);
    }
  }

  return valid;
}

export function cleanupCSRF() {
  const currentTime = Date.now();
  for (const entry of csrfTokens) {
    if (entry.expiry < currentTime) {
      csrfTokens.delete(entry);
    }
  }
}

export function validateJWT(req: Request) {
  const key = process.env.KEY;
  const header = req.header('Authorization');
  const [type, token] = header ? header.split(' ') : "";
  let payload: string | jwt.JwtPayload = "";

  // Guard; aka early return for common failures before verifying authorization
  if (!key) { return { success: false, status: 500, message: 'Wrong Configuration' }; }
  if (!header) { return { success: false, status: 401, message: 'No Authorization header' }; }
  if (type !== 'Bearer' || !token) { return { success: false, status: 400, message: 'Invalid Authorization header' }; }

  try {
    payload = jwt.verify(token, key);
  } catch (err) {
    let message = "could not verify";
    if (err instanceof Error) {
      if (err.name == "TokenExpiredError") {
        message = "Login expired";
      } else {
        message = `${err.name} -  ${err.message}`;
      }
    }

    return { success: false, status: 403, message: message };
  }

  // don't allow test user in production environment
  if (typeof payload == "object" && payload.user == "TEST" && process.env.NODE_ENV == "production") {
    return { success: false, status: 403, message: 'test user not allowed on production' };
  }

  return { success: true };
}

export function createJWT(req: Request, res: Response) {
  const key = process.env.KEY;
  if (!key) { throw new Error('Configuration is wrong'); }
  const today = new Date();
  const dateString = today.toLocaleDateString("de-DE", { weekday: "short", year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const payload = {
    date: dateString,
    user: req.body.user
  };
  const token = jwt.sign(payload, key, { expiresIn: 60 * 30 });
  res.locals.token = token;
  return token;
}
