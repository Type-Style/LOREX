import express, { Request, Response, NextFunction } from 'express';
import { create as createError } from '@src/middleware/error';
import logger from '@src/scripts/logger';
import { crypt, compare } from '@src/scripts/crypt';
import { loginSlowDown, loginLimiter, baseSlowDown, baseRateLimiter } from '@src/middleware/limit';
import { createToken } from '@src/scripts/token';

const router = express.Router();

router.get("/", baseSlowDown, baseRateLimiter, async function login(req: Request, res: Response) {
  res.locals.text = "start";
  loginLimiter(req, res, () => {
    res.render("login-form");
  });
});

router.post("/", loginSlowDown, async function postLogin(req: Request, res: Response, next: NextFunction) {
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


export default router;