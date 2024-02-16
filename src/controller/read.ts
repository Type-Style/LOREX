import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import logger from '@src/scripts/logger';

const router = express.Router();

router.get('/',
  [query('index').isInt().withMessage("not an integer")
    .isLength({ max: 3 }).withMessage("not in range")
    .toInt()],
  async function getRead(req: Request, res: Response, next: NextFunction) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return createError(res, 400, JSON.stringify({ errors: errors.array() }), next)
    }

    const fileObj: File.Obj = file.getFile(res, next);
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



// TODO will be converted to middleware
// TODO write test for checking the limit on request body
router.get("/login/", async function login(req: Request, res: Response) {
  logger.log("login was called");
  res.locals.text = "start";

  res.render("login-form");
});

router.post("/login/", async function postLogin(req: Request, res: Response) {
  logger.log("post login was called");
  logger.log(req.body);
  res.locals.text = "post recieved";
  res.render("login-form");
});

export default router;