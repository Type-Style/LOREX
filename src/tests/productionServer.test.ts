import axios from 'axios';
import qs from 'qs';
import { config } from 'dotenv';
import { getAxiosTestError } from './axiosTestError';

config();
// Allow extra time for live network round-trips and the login slow-down delay.
jest.setTimeout(10000);

// Live end-to-end guard checks against the real production server (ROOT).
// This suite always targets production and is excluded from the default `npm test`
// run (see jest.config.js modulePathIgnorePatterns); invoke it explicitly via
// `npm run test:production:prod`.
const SERVER = process.env.ROOT;

describe('production server guards', () => {
  beforeAll(() => {
    // Fail fast with a clear message instead of a cryptic "Invalid URL".
    if (!SERVER) { throw new Error("ROOT environment variable is not set; cannot reach the production server."); }
  });

  it('rejects the dev test-key on /write', async () => {
    // A request that would succeed in development (key=test convenience) must be
    // refused in production, where only the real KEY is accepted.
    const query = `user=xx&lat=45.000&lon=90.000&timestamp=${Date.now()}&hdop=50.0&altitude=5000.000&speed=150.000&heading=180.0&key=test`;
    const response = await axios.get(`${SERVER}/write?${query}`, { validateStatus: () => true });

    expect(response.status).toBe(403);
    expect(JSON.stringify(response.data)).toContain('Key');
  });

  it('rejects the TEST user login', async () => {
    // Obtain a fresh, single-use CSRF token, then attempt the TEST login.
    let csrfToken: string;
    try {
      const csrf = await axios.post(`${SERVER}/login/csrf`, undefined, {
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-requested-with": "XMLHttpRequest"
        }
      });
      csrfToken = csrf.data;
    } catch (error) {
      throw getAxiosTestError(error);
    }

    const response = await axios.post(
      `${SERVER}/login`,
      qs.stringify({ user: "TEST", password: "test", csrfToken }),
      { validateStatus: () => true }
    );

    // Note: a 403 here proves the TEST user cannot log in on production. If the
    // TEST user is not configured at all, this also yields 403 (accepted).
    expect(response.status).toBe(403);
  });
});
