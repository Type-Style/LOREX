import { Request, Response, NextFunction } from "express";
import logger from '@src/scripts/logger';


export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function handler(err: Error,  req: Request, res: Response<Response.Error>, next: NextFunction) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);

  const responseBody = {
		name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? "---" : err.stack,
  };

  logger.error(responseBody);
  res.json(responseBody);

	next();
}
