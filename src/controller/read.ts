import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import { isLoggedIn } from '@src/middleware/logged-in';

const router = express.Router();

router.get('/',
  isLoggedIn,
  [query('index').isInt().withMessage("not an integer")
    .isLength({ max: 3 }).withMessage("not in range")
    .toInt()],
  async function getRead(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return createError(res, 400, JSON.stringify({ errors: errors.array() }), next)
    }

    const fileObj: File.Obj = file.getFile(res, next, "read");
    // no content and no file found show empty data and exit 
    if (fileObj.content == false) { res.json(JSON.parse('{"entries": []}')); return }

    fileObj.content = await file.readAsJson(res, fileObj.path, next)
    if (!fileObj.content || !Array.isArray(fileObj.content.entries)) {
      return createError(res, undefined, `File corrupt: ${fileObj.path}`, next);
    }

    let entries = fileObj.content.entries;

    if (req.query.index) {
      entries = entries.slice(Number(req.query.index));
    }

    res.json({ entries });
  });


router.get('/maptoken',
  isLoggedIn,
  async function mapToken(req: Request, res: Response, next: NextFunction) {
    const token = process.env.MAPBOX;
    if (!token) { return createError(res, undefined, `Missing configuration, environment variable not defined`, next); }

    res.json({ token });
  }
);

router.get('/traffictoken',
  isLoggedIn,
  async function mapToken(req: Request, res: Response, next: NextFunction) {
    const token  = process.env.TOMTOM;
    if (!token) { return createError(res, undefined, `Missing configuration, environment variable not defined`, next); }

    res.json({ token });
  }
);


export default router;
