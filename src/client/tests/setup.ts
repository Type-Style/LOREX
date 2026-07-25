import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// Real requests against the dev server (/read fetches, failed logins) can take
// seconds; give every findBy*/waitFor a generous window once. The two real
// bcrypt logins in login.page.test.tsx override this locally with 20s.
configure({ asyncUtilTimeout: 10000 });

// jsdom does not implement window.matchMedia, which MUI's useMediaQuery/useColorScheme rely on.
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

// useData/Login log axios errors with %o; Node's util.inspect can crash on the
// jsdom internals those error objects reference, which would abort the app's
// catch block mid-flight (e.g. before setLogin(false)). Guard logging only and
// fall back to a plain-string line so diagnostics are never silently lost.
const originalConsoleLog = console.log;
console.log = (...args: unknown[]) => {
  try {
    originalConsoleLog(...args);
  } catch {
    originalConsoleLog(args.map(String).join(' '));
  }
};

afterEach(() => {
  cleanup();
});
