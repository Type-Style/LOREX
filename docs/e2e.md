# E2E Testing

Playwright tests the real application: login, entry writes and reads, map interactions, and visible results. Prefer observable behavior over mocks or call assertions. Use unit tests for isolated calculations and hooks; use Playwright for browser layout and UI wiring that jsdom cannot verify.

Desktop and mobile projects use Chromium; mobile emulates a Pixel 5, not a physical device. Check visible responsive content: container queries can hide status labels while their values remain visible.

## Safety and prerequisites

- Use a **disposable development/test environment** with the dev server already running at `http://localhost:80`. Agents must not start it automatically or skip tests if it is unavailable; report the missing prerequisite.
- Entry-writing scenarios **reset today's data file** before seeding; the `seedIfEmpty` helper below is an exception. Never seed a logged-out or empty-data scenario.
- Real writes use the literal key `test` only with `NODE_ENV=development`; a configured `KEY` is still required. Browser tests log in as `TEST` / `test`, requiring a matching `USER_TEST` hash; this user is rejected in production.
- Agents must never read, print, or edit `.env` files. Ask the owner to configure them; document environment changes in `.env_example`. See `src/controller/login.ts` and `src/models/entry.ts` for the guards.
- Keep one Playwright worker: tests share the daily data file. Do not run E2E, integration tests, cleanup, or the data generator concurrently against the same server.
- `npm run test:data` writes approximately every 30 seconds; agents must never run `test:data:prod`. Both `test:data:prod` and `test:production:prod` target live `ROOT`; `test:production` runs isolated local guards.
- CI runs backend integration separately from four isolated E2E shards: desktop/mobile × general/polling. Each has its own server and runner-owned daily file, allowing `clearEntries()` to reset data even though the server runs under `sudo`.

**Destructive cleanup:** `npm run test:postClear` runs `npm run build`, whose prebuild deletes `dist/*`, including runtime data. `npm run build` and `npm run dev` also perform this cleanup. Run them only when explicitly resetting a disposable environment, and coordinate server restarts with its owner.

## Running and debugging

```sh
npm run test:e2e                          # all E2E tests
npm run test:e2e -- e2e/popupTabs.spec.ts # one spec
npm run test:e2e -- --project=chromium    # or mobile-chromium
npm run test:e2e -- --grep="@polling"      # or --grep-invert="@polling"
```

Each command runs `scripts/checkE2ePrerequisites.js` first. The preflight checks that the server responds, not that credentials, writes, or data capacity work. Preflight and Playwright share the base URL in `scripts/e2eConfig.js`. Both browser projects depend on `e2e/auth.setup.ts`; keep the configured browser engine and CI installation in sync.

Failed tests retain traces in `test-results/`. Inspect actions, DOM snapshots, and requests with `npx playwright show-trace "test-results/<failing-test>/trace.zip"`.

## Test data

- Entries live in `dist/data/data-YYYY-MM-DD.json`, with a **1,000-entry daily cap**. Backend integration tests mutate today's file and fill it to the cap.
- `e2e/auth.setup.ts` logs in through the UI once per run and stores authentication in `temp/e2e-auth.json`. `uiLogin` reuses it; login/logout tests exercise the UI directly. Helpers use the real JWT for `/read` and real `/write` requests.
- Entry-writing scenarios call `clearEntries()` in `e2e/helpers.ts`, resetting today's file to `{"entries": []}`. Seed the values the scenario needs and verify returned identities and values. This keeps indices deterministic and avoids marker collisions and capacity exhaustion.
- The `seedIfEmpty` helper checks the server and, only if there are no entries, writes one and reloads the page. A temporarily empty UI does not prove the server has no entries.
- **A successful write does not prove an entry was appended:** at capacity it can be dropped or replace the last entry. Read back the data and check identity, values, and enough capacity for the entire scenario. A later write can also automatically ignore the previous entry.
- Keep write helpers aligned with validation: unknown query parameters are rejected, numeric inputs are limited to 12 characters, and timestamps must be within the permitted one-day window. Round computed coordinates and label multiple writes for useful failures.
- Avoid E2E mocks. The sole network-stub exception is `e2e/noData.spec.ts`, which fulfills the entries request matching `/read?` with `{ entries: [] }`. Login and token requests remain real; this tests the empty UI, not an empty backend file.

## Reliable assertions

- Register response waits before the action, then wait for the **rendered** update; a response alone does not prove React applied it. Prefer retrying meaningful assertions to fixed sleeps or broad timeouts.
- In hook tests, await each operation or track a changing completion counter. An initial zero or a previous `200` can otherwise look like a completed request.
- Assert entry identity, not just marker counts: clustering, viewport culling, animation, minimaps, or overlap can change counts. For automatic ignore, verify the specific server-side flag and its browser representation.
- Compare popup and status values with seeded inputs or real API results, including units and formatting. Scope selectors to the intended map or popup.
- Polyline polling adds entries with increasing latest indices, remounting `MultiColorPolyline`; it does not prove an existing path updates. The ignore scenario keeps the latest index and segment mounted, then checks its visible color change. Both guard against stale colors.
