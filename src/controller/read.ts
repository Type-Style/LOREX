import express, { Request, Response, NextFunction } from 'express';
import * as file from '@src/scripts/file';
import { create as createError } from '@src/middleware/error';
import { validationResult, query } from 'express-validator';
import jwt from 'jsonwebtoken';
import logger from '@src/scripts/logger';
import { crypt, compare } from '@src/scripts/crypt';
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
  loginLimiter(req, res, () => {
    res.render("login-form");
  });
});

router.post("/login/", loginSlowDown, async function postLogin(req: Request, res: Response, next: NextFunction) {
  logger.log(req.body);
  loginLimiter(req, res, async () => {
    let validLogin = false;
    const user = req.body.user;
    const password = req.body.password;
    let userFound = false;
    if (!user || !password) {
      return createError(res, 422, "Body does not contain all expected information", next);
    }

    // Loop through all environment variables
    for (const key in process.env) {
      if (!key.startsWith('USER')) { continue; }
      if (key.substring(5) == user) {
        userFound = true;
        const hash = process.env[key];
        if (hash) {
          validLogin = await compare(password, hash);
        }
      }
    }

    // only allow test user in test environment
    if (user == "TEST" && validLogin && process.env.NODE_ENV == "production") {
      validLogin = false;
    }

    if (validLogin) {
      const token = createToken(req, res);
      res.json({ "token": token });
    } else {
      if (!userFound) {
        await crypt(password); // If no matching user is found, perform a dummy password comparison to prevent timing attacks
      }
      return createError(res, 403, `invalid login credentials`, next);
    }
  });
});

function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const result = validateToken(req);
  if (!result.success) {
    createError(res, result.status, result.message || "", next)
  } else {
    next();
  }
}

function validateToken(req: Request) {
  const key = process.env.KEYA;
  const header = req.header('Authorization');
  const [type, token] = header ? header.split(' ') : "";
  let payload: string | jwt.JwtPayload = "";

  // Guard; aka early return for common failures before verifying authorization
  if (!key) { return { success: false, status: 500, message: 'Wrong Configuration' }; }
  if (!header) { return { success: false, status: 401, message: 'No Authorization header' }; }
  if (type !== 'Bearer' || !token) { return { success: false, status: 400, message: 'Invalid Authorization header' }; }

  try {
    payload = jwt.verify(token, key);
  } catch (err) {
    let message = "could not verify";
    if (err instanceof Error) {
      message = `${err.name} -  ${err.message}`;
    }

    return { success: false, status: 403, message: message };
  }

  // don't allow test user in production environment
  if (typeof payload == "object" && payload.user == "TEST" && process.env.NODE_ENV == "production") {
    return { success: false, status: 403, message: 'test user not allowed on production' };
  }

  return { success: true };
}

function createToken(req: Request, res: Response) {
  const key = process.env.KEYA;
  if (!key) { throw new Error('Configuration is wrong'); }
  const today = new Date();
  const dateString = today.toLocaleDateString("de-DE", { weekday: "short", year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const payload = {
    date: dateString,
    user: req.body.user
  };
  const token = jwt.sign(payload, key, { expiresIn: 60 * 2 });
  res.locals.token = token;
  logger.log(JSON.stringify(payload), true);
  return token;
}

export default router;
