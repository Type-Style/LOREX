import { Request, Response, NextFunction } from "express";
import logger from '@src/scripts/logger';

export function create(res:Response, status:number = 500, message:string, next:NextFunction) {
  /**
		* takes httpStatusCode and Message and forwards to error Handling
		*/
  const error = new Error(message);
  res.status(status);
  res.locals.error = true; // to let other middleware know that an error was called
  next(error)
}

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function handler(err: Error,  req: Request, res: Response<Response.Error>, next: NextFunction) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
	
  let message;
	try {
    const jsonMessage = JSON.parse(err.message);
    message = jsonMessage;
  } catch (e) {
    message = err.message;
  }
	
  const responseBody:Response.Error = {
		status: statusCode,
		name: err.name,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : "---"
  };

  logger.error(responseBody);
  res.json(responseBody);
	next();
}
