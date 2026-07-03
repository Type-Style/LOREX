import express from 'express';
import axios from 'axios';
import qs from 'qs';
import type { AddressInfo } from 'net';
import type { Server } from 'http';
import loginRouter from '../controller/login';
import writeRouter from '../controller/write';
import * as error from '../middleware/error';
import { crypt } from '../scripts/crypt';

// Mock the logger so the in-process handlers don't append to src/httpdocs/log/.
jest.mock('../scripts/logger', () => ({
  __esModule: true,
  default: { log: jest.fn(), error: jest.fn() },
}));

// Allow extra time for bcrypt hashing and the in-process server boot in beforeAll.
jest.setTimeout(10000);

// These tests exercise the real routers in-process with NODE_ENV=production.
// The running dev server is permanently NODE_ENV=development.
// NODE_ENV is a plain assignment (restored afterwards) - the guards read it at
// request time, so no module mocking is required.

let server: Server;
let base: string;

const original = {
  NODE_ENV: process.env.NODE_ENV,
  KEY: process.env.KEY,
  USER_TEST: process.env.USER_TEST,
};

beforeAll(async () => {
  // Controlled fixtures: with a real hash of "test", the TEST/test credentials
  // are genuinely valid. Therefore a 403 can only originate from the production
  // guard flipping validLogin to false - no positive control needed.
  process.env.KEY = "test";
  process.env.USER_TEST = await crypt("test", true);
  process.env.NODE_ENV = "production";

  const app = express();
  // Set a loopback ip so every rate limiter / slow-down skips (see middleware/limit.ts).
  app.use((req, res, next) => { res.locals.ip = "127.0.0.1"; next(); });
  app.use(express.urlencoded({ extended: true }));
  app.use('/login', loginRouter);
  app.use('/write', writeRouter);
  // createError only calls next(error); the handler emits the JSON body.
  app.use(error.handler);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as AddressInfo;
      base = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  process.env.NODE_ENV = original.NODE_ENV;
  process.env.KEY = original.KEY;
  process.env.USER_TEST = original.USER_TEST;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('production code guards (NODE_ENV=production)', () => {
  it('blocks the valid TEST user at login', async () => {
    const csrf = await axios.post(`${base}/login/csrf`, undefined, {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "x-requested-with": "XMLHttpRequest"
      }
    });

    const response = await axios.post(
      `${base}/login`,
      qs.stringify({ user: "TEST", password: "test", csrfToken: csrf.data }),
      { validateStatus: () => true }
    );

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.data)).toContain('Invalid credentials');
  });

  it('blocks the dev test-key on /write', async () => {
    const query = `user=xx&lat=45.000&lon=90.000&timestamp=${Date.now()}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`;
    const response = await axios.get(`${base}/write?${query}`, { validateStatus: () => true });

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.data)).toContain('Key');
  });
});
