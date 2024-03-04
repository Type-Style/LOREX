import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import logger from '@src/scripts/logger';
import { create } from 'domain';

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

  // TODO login authentication here
  const validLogin = true;
  if (!validLogin) {
    return res.redirect("/read/login");
  } else {
    createToken(req, res);
    res.render("login-form");   // TODO Send Token only
  }
});

function isLoggedIn(req: Request, res: Response) {
  const result = validateToken(req, res);
  if (!result) {
    return res.redirect("/read/login");
  }
}


function validateToken(req: Request, res: Response) {
  const key = process.env.KEYB;
  const header = req.header('Authorization');
  const [type, token] = header ? header.split(' ') : "";
  let payload: string | jwt.JwtPayload = "";
  if (type === 'Bearer' && typeof token !== 'undefined' && key) {
    try {
      payload = jwt.verify(token, key);
      res.status(200).send({ code: 0, message: `all good` });
    } catch (err) {
      res.status(401).send({ code: 123, message: 'Invalid or expired token.' });
    }
    console.log("payload: " + payload + " _ " + !!payload);
    return !!payload;
  } else {
    return false;
  }
}


function createToken(req: Request, res: Response) {
  const key = process.env.KEYB;
  if (!key) { throw new Error('KEYA is not defined in the environment variables'); }
  const id = Math.random().toString(36).substring(2, 8);
  const payload = {
    _id: id
  };
  const token = jwt.sign(payload, key, { expiresIn: 60 * 1 });
  res.locals.token = token;
}

export default router;