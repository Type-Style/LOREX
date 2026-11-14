import { baseURL } from './e2eConfig.js';

// Fail once when the external server is unavailable, rather than timing out every spec.

try {
  const response = await fetch(baseURL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) {
    console.error(`e2e preflight: server at ${baseURL} answered ${response.status} instead of the start page.`);
    process.exit(1);
  }
} catch (error) {
  const reason = error.cause?.code || error.name;
  console.error(`e2e preflight: server at ${baseURL} is not reachable (${reason}). Start the dev server first - the e2e suite expects it to be running.`);
  process.exit(1);
}

console.log(`e2e preflight ok: server up at ${baseURL}`);
