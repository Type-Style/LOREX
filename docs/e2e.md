# E2E Testing

## Purpose And Boundaries

End-to-end tests verify observable results through the real application: log in, write/read entries, interact with the UI, and check the resulting content and behavior. Prefer these over mocks or assertions that merely prove an implementation function was called. Unit tests remain useful for isolated calculations and hook state transitions. Never seed a logged-out or empty-data scenario.

- `npm run test` runs backend Jest tests in `src/tests/`. App, login, and integration tests use the main dev server at `http://localhost:80`.
- `npm run test:react` runs frontend unit/integration-style tests (Vitest, jsdom) in `src/client/tests/`. Some call the dev server; none mutate its data.
- `npm run test:e2e` runs Playwright specs in `e2e/` against the dev server on desktop (`chromium`) and mobile (`mobile-chromium`, Pixel 5) viewports, including real browser rendering, navigation, map interactions, and layout. Preflight and `playwright.config.ts` import the same base URL from `scripts/e2eConfig.js`.
- `npm run test:data` deliberately sends repeated writes about every 30 seconds and is excluded from ordinary Jest runs. Its `test:data:prod` counterpart targets `ROOT`; neither is a harmless substitute for E2E setup. As an Agent, never run `test:data:prod`!
- Local production guard tests (`test:production`) exercise isolated routers; `test:production:prod` instead targets the configured live server. Neither is part of E2E verification.

Desktop and mobile runs exercise mode switching and status behavior. Check actual visible responsive content and layout; status labels can be hidden by container queries while their values remain visible. Mobile emulation does not imply testing a physical device or another browser engine.

## Hook Tests Versus Browser Tests

Keep hook logic tests separate from browser integration checks. A test component can verify hook results; it cannot prove that popup controls are wired correctly, a marker represents the right entry, or responsive rows align. jsdom does not perform browser layout, so row geometry assertions belong in Playwright.

## Prerequisites And Safety

Use an intentionally disposable development/test environment. The running dev server is a prerequisite: starting it automatically or skipping tests is forbidden. If it is unavailable, report that prerequisite.

Real writes use the literal key `test` only with `NODE_ENV=development`. A configured `KEY` is still required. As an Agent, never read, print, or edit `.env` files to diagnose prerequisites. Ask the environment owner to configure them; environment documentation changes belong in `.env.example` only. See `src/controller/login.ts` and `src/models/entry.ts` for the guards.

## Preflight

`npm run test:e2e` invokes `pretest:e2e` (`scripts/checkE2ePrerequisites.js`) before launching browsers. Preflight fails fast instead of letting every login time out. A reachable start page does not prove valid credentials, successful writes, or available data capacity.

## Data Lifecycle

- Entries are stored per day in `dist/data/data-YYYY-MM-DD.json`, capped at 1000 entries. Backend integration tests mutate today's file, depend on its state/order, and fill it to the cap.
- Tests that need entries own their setup through real `/write` and authenticated `/read` requests in `e2e/helpers.ts`, using the JWT from UI login, not a fabricated token.
- Read today's entries to decide whether seeding is needed; the UI's temporary empty state is not evidence that the server has no data.
- Read-only scenarios use `seedIfEmpty`: it writes one entry only if today's data is empty, reloads the browser page so the UI shows it, and returns the server's entries.
- Scenarios that depend on particular coordinates, values, or relationships should write their own entries and assert their returned identities and values.
- Keep the write helper aligned with server validation: `checkExact()` rejects unknown query parameters, numeric inputs have a 12-character limit (round computed coordinates to avoid strings such as `50.245000000000005`), and timestamps must stay within the permitted one-day window. Label multiple writes so failures identify the failing operation.
- **A successful HTTP write is not proof that an entry was appended.** At capacity, writes can be dropped or replace the last entry. Read back the result and verify identity, values, and enough remaining capacity for the entire scenario.
- Incoming entries start non-ignored, but a subsequent write can automatically ignore the previous entry; do not assume earlier seeded entries remain visible.
- Before browser tests after integration, intentionally reset disposable data:

```sh
npm run test:postClear
```

**This DELETES runtime data, not just test reports.** `test:postClear` runs `npm run build`; its `prebuild` removes `dist/*`, including `dist/data/`, then rebuilds and copies static assets. Use it only when clearing that environment is explicitly intended. `npm run build` and `npm run dev` have the same destructive cleanup concern. As an Agent, coordinate any necessary server restart with its owner rather than starting it automatically.

CI has a narrower intentional reset in `.github/workflows/main.yml`: `sudo rm -rf dist/data` after integration and before E2E. The server starts under `sudo`, so its generated data can be root-owned; the runner needs matching permissions to clear it. This is a disposable CI reset, not a general recommendation to delete production files or rebuild the running server.

Keep one Playwright worker while specs share the daily data file. Desktop and mobile project runs both consume the same server data even though browser contexts are isolated. Setup must tolerate repeated runs, leave capacity for subsequent scenarios, and avoid depending on another spec having run first. One worker does not serialize separate test commands: do not run integration, cleanup, E2E, or the data generator concurrently against the same server.

## The Empty-Data Exception

Avoid mocks in E2E. The sole intentional network-stub exception is the empty entries response in `e2e/noData.spec.ts`: fulfill the entries request matching `/read?` with `{ entries: [] }`.

Other specs write data and runs repeat, so an actually empty shared server cannot be guaranteed. This narrow stub makes the empty UI scenario order-independent without deleting data or conflicting with self-seeding tests. Login remains real; `/read/maptoken` and `/read/traffictoken` must remain real too. It tests the UI's response to an empty result, not backend empty-file behavior.

## Reliable Assertions

- Await the operation being tested, then assert its result. Register response waits before the triggering action and wait for the corresponding rendered update; a response arriving does not itself prove React has applied it.
- In hook tests, await the returned operation or expose a completion counter/state that changes for each invocation. An initial count of zero can already match an empty response, and a previous `200` can already match the next fetch. Neither proves the new operation completed.
- Prefer retrying assertions on meaningful content over fixed sleeps. Login, API work, map animation, and rendering can finish at different times. Broad timeouts should not substitute for a correct completion signal.
- Assert entry identity, not just marker totals. Clustering, viewport culling, fly-to animation, minimaps, and overlapping markers can change counts without changing ignore behavior. Scope selectors to the main map or intended popup and verify the selected entry's index/content.
- For automatic ignore, verify the server marks the specific previous entry ignored after the next write, then verify that entry's browser representation. A net-zero marker-count delta could hide the wrong marker disappearing.
- Compare popup/status values with deliberately seeded inputs or the relevant real API result, including units and formatting. Generic assertions such as "some km/h text exists" can accidentally match another component.

## Running And Debugging

```sh
npm run test:e2e
```

Select a spec while preserving npm preflight with `npm run test:e2e -- e2e/popupTabs.spec.ts`. Select a viewport by its project name from `playwright.config.ts`: `npm run test:e2e -- --project=chromium` (desktop) or `npm run test:e2e -- --project=mobile-chromium` (mobile, Pixel 5). Keep the configured browser engine and the CI browser installation in sync.

The Playwright configuration retains traces on failure in `test-results/`. Open the failing test's actual archive locally:

```sh
npx playwright show-trace "test-results/<failing-test>/trace.zip"
```

Inspect actions, DOM snapshots, and network requests to distinguish a prerequisite failure, a dropped write, an unfinished operation, an incorrect selector, or a genuine UI regression. CI uploads `test-results/` as the `playwright-results` artifact on failure. Traces can contain authentication and application data; treat them as sensitive rather than publishing them indiscriminately. See the [Playwright Trace Viewer documentation](https://playwright.dev/docs/trace-viewer).
