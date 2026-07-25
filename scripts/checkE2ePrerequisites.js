// Preflight for the Playwright suite (wired as pretest:e2e): fail fast with one
// clear message instead of letting every spec time out individually. The only
// hard requirement is the running dev server - the specs create the entries they
// need themselves. Run npm run test:postClear first for a clean server state
// (see AGENTS.md), especially after the Jest integration suite filled today's
// data file to the 1000-entry cap.

const baseUrl = 'http://localhost:80'; // keep in sync with playwright.config.ts baseURL

try {
  const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    console.error(`e2e preflight: server at ${baseUrl} answered ${response.status} instead of the start page.`);
    process.exit(1);
  }
} catch (error) {
  const reason = error.cause?.code || error.name;
  console.error(`e2e preflight: server at ${baseUrl} is not reachable (${reason}). Start the dev server first - the e2e suite expects it to be running.`);
  process.exit(1);
}

console.log(`e2e preflight ok: server up at ${baseUrl}`);
