import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import logger from '@src/scripts/logger';
import { crypt } from '@src/scripts/crypt';
import { loginSlowDown, loginLimiter, baseSlowDown, baseRateLimiter } from '@src/middleware/limit';

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


router.get("/login/", baseSlowDown, baseRateLimiter, async function login(req: Request, res: Response) {
  res.locals.text = "start";

  res.render("login-form");
});

router.post("/login/", loginSlowDown, async function postLogin(req: Request, res: Response, next: NextFunction) {
  logger.log(req.body);
  res.locals.text = "post recieved";
  loginLimiter(req, res, () => {
    let validLogin = false;
    const user = req.body.user;
    const password = req.body.password;
    let cryptedPassword = "";
    if (!user || !password) {
      return createError(res, 422, "Body does not contain all expected information", next);
    }

    cryptedPassword = crypt(password);

    // Loop through all environment variables
    for (const key in process.env) {
      if (!key.startsWith('USER')) { continue; }
      if (key.substring(5) == user &&
        process.env[key] == cryptedPassword) {
        validLogin = true;
        break;
      }
    }

    // only allow test user in test environment
    if (user == "test" && validLogin && process.env.NODE_ENV == "production") {
      validLogin = false;
    }

    if (validLogin) {
      const token = createToken(req, res);
      res.json({ "token": token });
    } else {
      return createError(res, 403, `invalid login credentials`, next);
    }
  });
});

function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const result = validateToken(req, res);
  if (!result) {
    loginLimiter(req, res, () => {
      res.redirect("/read/login");
    });
  }
  next();
}

function validateToken(req: Request, res: Response) {
  const key = process.env.KEYB;
  const header = req.header('Authorization');
  const [type, token] = header ? header.split(' ') : "";
  let payload: string | jwt.JwtPayload = "";
  if (type === 'Bearer' && typeof token !== 'undefined' && key) {
    try {
      payload = jwt.verify(token, key);
    } catch (err) {
      res.status(401).send({ message: 'Invalid or expired token.' });
    }

    // don't allow test user in production environment
    if (typeof payload == "object" && !!payload && payload.user == "test" && process.env.NODE_ENV == "production") {
      return false;
    }

    return !!payload;
  } else {
    return false;
  }
}

function createToken(req: Request, res: Response) {
  const key = process.env.KEYB;
  if (!key) { throw new Error('KEYA is not defined in the environment variables'); }
  const today = new Date();
  const dateString = today.toLocaleDateString("de-DE", { weekday: "short", year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const payload = {
    date: dateString,
    user: req.body.user
  };
  const token = jwt.sign(payload, key, { expiresIn: 60 * 1 });
  res.locals.token = token;
  logger.log(JSON.stringify(payload), true);
  return token;
}

export default router;
