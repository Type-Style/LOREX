# E2E Testing

## Purpose And Boundaries

End-to-end tests verify observable behavior in the real application: log in, write/read entries, and interact with the UI. Prefer them to mocks or call assertions; unit tests suit isolated calculations and hook state transitions. Never seed a logged-out or empty-data scenario.

- `npm run test` runs backend Jest tests in `src/tests/`. App, login, and integration tests use the main dev server at `http://localhost:80`.
- `npm run test:react` runs frontend unit/integration-style tests (Vitest, jsdom) in `src/client/tests/`. Some call the dev server; none mutate its data.
- `npm run test:e2e` runs Playwright specs in `e2e/` against the dev server on desktop (`chromium`) and mobile (`mobile-chromium`, Pixel 5) viewports, including real browser rendering, navigation, map interactions, and layout. Preflight and `playwright.config.ts` import the same base URL from `scripts/e2eConfig.js`.
- `npm run test:data` deliberately sends repeated writes about every 30 seconds and is excluded from ordinary Jest runs. Its `test:data:prod` counterpart targets `ROOT`; neither is a harmless substitute for E2E setup. As an Agent, never run `test:data:prod`!
- Local production guard tests (`test:production`) exercise isolated routers; `test:production:prod` instead targets the configured live server. Neither is part of E2E verification.

Desktop and mobile runs exercise mode switching and status behavior. Check visible responsive content and layout; container queries can hide status labels while values remain visible. Mobile emulation does not test a physical device or another browser engine.

## Hook Tests Versus Browser Tests

Keep hook logic tests separate from browser checks. A test component can verify hook results, not popup wiring, marker identity, or responsive row alignment. jsdom does not perform layout, so row geometry assertions belong in Playwright.

## Prerequisites And Safety

Use an intentionally disposable development/test environment. The running dev server is a prerequisite: starting it automatically or skipping tests is forbidden. If it is unavailable, report that prerequisite.

Real writes use the literal key `test` only with `NODE_ENV=development`. A configured `KEY` is still required. As an Agent, never read, print, or edit `.env` files to diagnose prerequisites. Ask the environment owner to configure them; environment documentation changes belong in `.env_example` only. See `src/controller/login.ts` and `src/models/entry.ts` for the guards.

## Preflight

`npm run test:e2e` invokes `pretest:e2e` (`scripts/checkE2ePrerequisites.js`) before launching browsers. Preflight fails fast instead of letting every login time out. A reachable start page does not prove valid credentials, successful writes, or available data capacity.

## Data Lifecycle

- Entries are stored per day in `dist/data/data-YYYY-MM-DD.json`, capped at 1000 entries. Backend integration tests mutate today's file, depend on its state/order, and fill it to the cap.
- `e2e/auth.setup.ts` performs one real UI login per Playwright run and saves `localStorage` `storageState` to `temp/e2e-auth.json`; `uiLogin` reuses that authenticated state while login/logout specs exercise the login flow directly. Tests that need entries own their setup through real `/write` and authenticated `/read` requests in `e2e/helpers.ts`, using the JWT from UI login, not a fabricated token.
- Entry-writing scenarios call `clearEntries()` in `e2e/helpers.ts` to reset today's `dist/data/data-YYYY-MM-DD.json` to `{"entries": []}` before seeding, keeping entry indices deterministic and avoiding marker collisions or capacity exhaustion across specs and viewport projects.
- Read today's entries to decide whether seeding is needed; the UI's temporary empty state is not evidence that the server has no data.
- Read-only scenarios use `seedIfEmpty`: it writes one entry only if today's data is empty, reloads the browser page so the UI shows it, and returns the server's entries.
- Scenarios that depend on particular coordinates, values, or relationships should reset via `clearEntries()`, write their own entries, and assert their returned identities and values.
- Keep the write helper aligned with server validation: `checkExact()` rejects unknown query parameters, numeric inputs have a 12-character limit (round computed coordinates to avoid strings such as `50.245000000000005`), and timestamps must stay within the permitted one-day window. Label multiple writes so failures identify the failing operation.
- **A successful HTTP write is not proof that an entry was appended.** At capacity, writes can be dropped or replace the last entry. Read back the result and verify identity, values, and enough remaining capacity for the entire scenario.
- Incoming entries start non-ignored, but a subsequent write can automatically ignore the previous entry; do not assume earlier seeded entries remain visible.
- To perform a full clean rebuild when explicitly resetting a disposable local environment:

```sh
npm run test:postClear
```

**This DELETES runtime data, not just test reports.** `test:postClear` runs `npm run build`; its `prebuild` removes `dist/*`, including `dist/data/`, then rebuilds and copies static assets. Use it only when clearing that environment is explicitly intended. `npm run build` and `npm run dev` have the same destructive cleanup concern. As an Agent, coordinate any necessary server restart with its owner rather than starting it automatically.

CI runs backend integration and E2E as separate jobs (`.github/workflows/main.yml`), with E2E split into 4 parallel matrix shards (`chromium` / `mobile-chromium` × `general` / `polling`), each on its own fresh runner with its own server. Because the CI server starts under `sudo`, each E2E shard pre-creates a runner-owned `dist/data/data-YYYY-MM-DD.json` before Playwright starts so `clearEntries()` can reset it between specs without elevated privileges.

Keep one Playwright worker while specs in a run share the daily data file (`clearEntries()` resets the shared file at the start of entry-writing specs, so parallel workers against one server would overwrite each other's fixtures). One worker does not serialize separate test commands: do not run integration, cleanup, E2E, or the data generator concurrently against the same server.

## The Empty-Data Exception

Avoid mocks in E2E. The sole intentional network-stub exception is the empty entries response in `e2e/noData.spec.ts`: fulfill the entries request matching `/read?` with `{ entries: [] }`.

Other specs write data and runs repeat, so an actually empty shared server cannot be guaranteed. This narrow stub makes the empty UI scenario order-independent without deleting data or conflicting with self-seeding tests. Login remains real; `/read/maptoken` and `/read/traffictoken` must remain real too. It tests the UI's response to an empty result, not backend empty-file behavior.

## Reliable Assertions

- Await the operation and assert its result. Register response waits before the action, then wait for the rendered update; a response alone does not prove React applied it.
- In hook tests, await the operation or expose a completion counter/state that changes each invocation. An initial zero can match an empty response, and a previous `200` can match the next fetch; neither proves completion.
- Prefer retrying assertions on meaningful content over fixed sleeps. Login, API work, map animation, and rendering finish at different times. Broad timeouts cannot replace a completion signal.
- Assert entry identity, not just marker totals. Clustering, viewport culling, fly-to animation, minimaps, and overlapping markers can change counts without changing ignore behavior. Scope selectors to the main map or intended popup and check the entry's index/content.
- For automatic ignore, verify the server marks the specific previous entry ignored after the next write, then check its browser representation. A net-zero marker-count delta could hide the wrong marker disappearing.
- Polyline polling adds entries with increasing latest indices, remounting `MultiColorPolyline`, so it cannot establish that an existing path updates. The ignore scenario keeps the latest index and same segment mounted, then verifies its visible path style changes. Both guard against stale colors; assert rendered results rather than React internals.
- Compare popup/status values with seeded inputs or the real API result, including units and formatting. Generic assertions such as "some km/h text exists" can match another component.

## Running And Debugging

```sh
npm run test:e2e
```

Select a spec with preflight: `npm run test:e2e -- e2e/popupTabs.spec.ts`. Select a viewport with `--project=chromium` (desktop) or `--project=mobile-chromium` (mobile, Pixel 5); both depend on the `setup` project in `e2e/auth.setup.ts`, which writes `temp/e2e-auth.json`. Isolate or skip slow real-timer polling specs with `--grep="@polling"` or `--grep-invert="@polling"`. Keep the configured browser engine and CI installation in sync.

The Playwright configuration retains traces on failure in `test-results/`. Open the failing test's actual archive locally:

```sh
npx playwright show-trace "test-results/<failing-test>/trace.zip"
```

Inspect actions, DOM snapshots, and network requests to distinguish prerequisite failures, dropped writes, unfinished operations, incorrect selectors, and UI regressions. CI uploads `test-results/` as `playwright-results-<project>-<suite>` on failure. Traces can contain authentication and application data; treat them as sensitive rather than publishing them indiscriminately. See the [Playwright Trace Viewer documentation](https://playwright.dev/docs/trace-viewer).
