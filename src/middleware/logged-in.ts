import { Request, Response, NextFunction } from 'express';
import { validateJWT } from '@src/scripts/token';
import { create as createError } from '@src/middleware/error';
import { readLimiter } from "./limit";


export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const result = validateJWT(req, res);
  if (!result.success) {
    readLimiter(req, res, () => {
      createError(res, result.status, result.message || "", next)
    });
  } else {
    next();
  }
}
