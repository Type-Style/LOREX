import jwt from 'jsonwebtoken';
import logger from '@src/scripts/logger';
import {Request, Response } from 'express';


export function validateToken(req: Request) {
  const key = process.env.KEYA;
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
      message = `${err.name} -  ${err.message}`;
    }

    return { success: false, status: 403, message: message };
  }

  // don't allow test user in production environment
  if (typeof payload == "object" && payload.user == "TEST" && process.env.NODE_ENV == "production") {
    return { success: false, status: 403, message: 'test user not allowed on production' };
  }

  return { success: true };
}

export function createToken(req: Request, res: Response) {
  const key = process.env.KEYA;
  if (!key) { throw new Error('Configuration is wrong'); }
  const today = new Date();
  const dateString = today.toLocaleDateString("de-DE", { weekday: "short", year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const payload = {
    date: dateString,
    user: req.body.user
  };
  const token = jwt.sign(payload, key, { expiresIn: 60 * 2 });
  res.locals.token = token;
  logger.log(JSON.stringify(payload), true);
  return token;
}
