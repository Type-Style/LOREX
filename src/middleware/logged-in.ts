import { Request, Response, NextFunction } from 'express';
import { validateToken } from '@src/scripts/token';
import { create as createError } from '@src/middleware/error';


export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const result = validateToken(req);
  if (!result.success) {
    createError(res, result.status, result.message || "", next)
  } else {
    next();
  }
}
