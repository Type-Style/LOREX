import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import logger from '@src/scripts/logger';
import { crypt } from '@src/scripts/crypt';
import { loginSlowDown, loginLimiter } from '@src/middleware/limit';

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

router.post("/login/", loginSlowDown, async function postLogin(req: Request, res: Response, next: NextFunction) {
  logger.log("post login was called");
  logger.log(req.body);
  res.locals.text = "post recieved";
  loginLimiter(req, res, () => {
    let validLogin = false;
    const password = crypt(req.body.password);
    // Loop through all environment variables
    for (const key in process.env) {
      if (!key.startsWith('USER')) { continue; }
      if (key.substring(5) == req.body.user &&
        process.env[key] == password) {
        validLogin = true;
        break;
      }
    }
    if (validLogin) {
      const token = createToken(req, res);
      res.json({ "token": token });
    } else {
      res.redirect("/read/login");
    }
  });
});

function isLoggedIn(req: Request, res: Response) {
  console.log("login check");
  const result = validateToken(req, res);
  if (!result) {
    loginLimiter(req, res, () => {
      res.redirect("/read/login");
    });
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
  return token;
}

export default router;