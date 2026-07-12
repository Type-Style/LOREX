# Repository Instructions

## Shape
- Single npm project: Express/TypeScript backend in `src/` with entrypoint `src/app.ts`; React 19 frontend in `src/client/` with entrypoint `src/client/index.tsx` and Vite config at `src/client/vite.config.js`.
- Backend TypeScript excludes `src/client/`, `src/tests/`, and `src/testData/`; frontend and tests have separate configs at `src/client/tsconfig.json` and `tsconfig.tests.json`.
- Backend imports use `@src/*`; runtime resolution depends on `module-alias/register` and `_moduleAliases` mapping `@src` to `dist`.
- Static files live in `httpdocs/`; builds copy them into ignored `dist/httpdocs/`. Runtime data is written under ignored `dist/data/`.

## Commands
- DONT START THE Dev server expect it to be running. If not and request fail because of it, inform the user!
- Verification for code changes: run `npm run lint`, `npm run typecheck`.
- React Compiler is enabled through Vite/Babel and enforced by ESLint;

## Tests
- `npm run test` is Jest only (backend, `src/tests/`); it does not start the server. `app`, `login`, and `integration` tests call `http://localhost:80`, so start the app separately first.
- `npm run test:react` is Vitest (React client, `src/client/tests/`, jsdom + Testing Library). The page tests also call the running server at `http://localhost:80` (login with the dev-only `TEST`/`test` user) but never write entries; they are type-checked by `typecheck:frontend`. Jest ignores `src/client/`.
- `npm run test:e2e` is Playwright (`e2e/*.spec.ts`, chromium) against the running server. Run `npm run test:postClear` before e2e: the specs seed the entries they need themselves (`e2e/helpers.ts`), but the integration tests fill today's data file to the 1000-entry cap, where `/write` silently stops appending and the ignore test cannot work. A `pretest:e2e` preflight (`scripts/checkE2ePrerequisites.js`) fails fast when the server is down.
- Integration tests mutate `dist/data/data-YYYY-MM-DD.json` and assume today’s file state/order; remove or isolate generated `dist/data/` only when you intentionally reset test data using `npm run test:postClear`
- `src/testData/createTestData.test.ts` is excluded from normal Jest and runs via `npm run test:data`; it sends entries every 30 seconds to a running server.

### Test style 
Avoid mocking. The tests test real functionality rather than the code itself (unless unit test). End to end style tests are prefered that actually verify the implementation over ensure the code runs as expected.

## Runtime Gotchas
- `NODE_ENV=development` disables Helmet and allows the special write key `test`; `NODE_ENV=production` blocks `USER_TEST` login.

## Analysis output
Use the temp folder in root of the project to output .md files for analysis.