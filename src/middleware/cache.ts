import {Request, Response, NextFunction } from 'express';

const setCache = function  (req: Request, res: Response, next: NextFunction)  {	
	const seconds = 60 * 5; // 5 minuits
	
	//  cache get requests but nothing else
	if (req.method == "GET") {
		res.set("Cache-control", `public, max-age=${seconds}`);
	} else {
		res.set("Cache-control", 'no-store');
	}

	next();
}
export default setCache;