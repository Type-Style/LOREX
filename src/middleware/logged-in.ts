import { Request, Response, NextFunction } from 'express';
import { validateJWT } from '@src/scripts/token';
import { create as createError } from '@src/middleware/error';


export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const result = validateJWT(req);
  if (!result.success) {
    createError(res, result.status, result.message || "", next)
  } else {
    next();
  }
}
