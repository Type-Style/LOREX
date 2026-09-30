# Repository Instructions

## Shape
- Single npm project: Express/TypeScript backend in `src/` with entrypoint `src/app.ts`; React 19 frontend in `src/client/` with entrypoint `src/client/index.tsx` and Vite config at `src/client/vite.config.js`.
- Backend TypeScript excludes client/tests/testData; separate configs: `src/client/tsconfig.json`, `tsconfig.tests.json`, `e2e/tsconfig.json`.
- Backend imports use `@src/*`; runtime resolution depends on `module-alias/register` and `_moduleAliases` mapping `@src` to `dist`.
- Static files live in `httpdocs/`; builds copy them into ignored `dist/httpdocs/`. Runtime data is written under ignored `dist/data/`.
- React Compiler is enabled through Vite/Babel and enforced by ESLint.

## Safety
- Never automatically start the dev server; expect it to be running externally and report if unavailable.
- Never read or write `.env` files. Environment documentation changes belong in `.env.example` only.
- `npm run build`, `npm run dev`, and `npm run test:postClear` invoke cleanup that DELETES runtime `dist/` data. Reset only intentionally disposable test data, never production data.
- `NODE_ENV=development` disables Helmet and permits write key `test` (requires configured `KEY`); `TEST`/`test` login still requires a configured bcrypt hash in `USER_TEST`. Production blocks `TEST` login and has no dev write-key bypass.

## Commands And Tests
- Verify changes with `npm run lint`, `npm run typecheck`, and `npm run typecheck:tests`. Lint auto-fixes; use `npm run lint -- --no-fix` when unrelated concurrent edits must remain untouched.
- `npm run test`: backend Jest; app/login/integration suites require the external server at `http://localhost:80`. Integration mutates today's data and fills the 1000-entry cap.
- `npm run test:react`: client Vitest/jsdom; server-backed tests use the external server without writing entries. Client tests are included in frontend typechecking, not Jest.
- `npm run test:e2e`: real-browser Playwright with preflight; seeds real entries. See [E2E guide](docs/e2e.md) for prerequisites, intentional cleanup, test design, and debugging.
- `npm run test:data`: excluded from normal Jest; repeatedly WRITES entries every 30 seconds. `test:data:prod` targets `ROOT`; never run it as routine verification.
- `npm run test:production`: isolated local production guards. `test:production:prod` targets the configured live `ROOT`; do not confuse it with local verification.
- Prefer real, observable results over mocks or implementation-call assertions; detailed test boundaries are in the E2E guide.

## Analysis output
Use root `temp/` for analysis Markdown.
