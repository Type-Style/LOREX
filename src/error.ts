import { Request, Response, NextFunction } from "express";

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
	
  const responseBody = {
		status: statusCode,
		name: err.name,
    message: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : "---"
  };

  //logger.error(responseBody);
  res.json(responseBody);

	next();
}
