// Register DOM assertions (for example toBeVisible) for every Vitest file.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Retrying DOM assertions must allow real HTTP/bcrypt work to finish.
// This changes the wait limit, not the requests; login tests allow 20s where needed.
configure({ asyncUtilTimeout: 10000 });

// MUI requires matchMedia, but jsdom has no viewport layout engine.
// Supply its interface without claiming responsive coverage; Playwright tests real breakpoints.
if (typeof window.matchMedia !== 'function') {
  const matchMediaStub = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  window.matchMedia = matchMediaStub;
}

// Formatting Axios errors can throw while inspecting jsdom objects, interrupting logout.
// Keep diagnostics, but fall back to strings if inspection fails; requests/errors remain real.
const originalConsoleLog = console.log;
console.log = (...args: unknown[]) => {
  try {
    originalConsoleLog(...args);
  } catch {
    originalConsoleLog(args.map(String).join(' '));
  }
};

afterEach(() => {
  // Unmount components and dispose their effects so DOM and timers cannot leak between tests.
  cleanup();
});
