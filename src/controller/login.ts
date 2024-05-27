import express, { Request, Response, NextFunction } from 'express';
import { create as createError } from '@src/middleware/error';
import { crypt, compare } from '@src/scripts/crypt';
import { loginSlowDown, loginLimiter, baseSlowDown, baseRateLimiter } from '@src/middleware/limit';
import { createJWT, createCSRF, validateCSRF } from '@src/scripts/token';


const router = express.Router();

// TODO refactor endpoint to get token
router.get("/csrf", baseSlowDown, baseRateLimiter, async function csrf(req: Request, res: Response, next: NextFunction) {
  loginLimiter(req, res, () => {
    const csrfToken = createCSRF(res, next);
    if (csrfToken) {
      res.json(csrfToken);
    }
  });
});

router.post("/", loginSlowDown, async function postLogin(req: Request, res: Response, next: NextFunction) {
  loginLimiter(req, res, async () => {
    let validLogin = false;
    const token = req.body.csrfToken;
    const user = req.body.user;
    const password = req.body.password;
    let userFound = false;
    if (!user || !password) { return createError(res, 422, "Body does not contain all expected information", next); }
    if (!token || !validateCSRF(req.body.csrfToken)) { return createError(res, 403, "Invalid CSRF Token \n retry in 5 Minuits", next); }

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
      const token = createJWT(req, res);
      res.json({ "token": token });
    } else {
      if (!userFound) {
        await crypt(password); // If no matching user is found, perform a dummy password comparison to prevent timing attacks
      }
      return createError(res, 403, `Invalid credentials`, next);
    }
  });
});


export default router;