import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import Subinfo from '../components/Subinfo';
import { makeEntry } from './testUtils';

const now = Date.UTC(2026, 0, 15, 12);
const noFetchTimes = { last: undefined, next: undefined };

describe('Subinfo', () => {
  beforeEach(() => {
    // Keep import/Suspense scheduling real while controlling the progress interval and clock.
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(now);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([false, true])('renders nothing without entries or fetch times (logged in: %s)', (isLoggedIn) => {
    const { container } = render(<Subinfo entries={[]} isLoggedIn={isLoggedIn} fetchTimes={noFetchTimes} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders only the latest entry, preserving element order and info classes', () => {
    const entries = [makeEntry({ address: 'Previous address' }), makeEntry({ lat: 51.25, lon: -0.5 })];
    const { container } = render(<Subinfo entries={entries} isLoggedIn fetchTimes={noFetchTimes} />);

    expect(Array.from(container.children, element => [element.tagName, element.className, element.textContent])).toEqual([
      ['STRONG', 'info noDivider', 'GPS:'],
      ['A', 'info', '51.25 / -0.5'],
      ['SPAN', 'info', 'Test Street, Test Town'],
      ['SPAN', 'info', 'Instant'],
    ]);
    expect(screen.getByRole('link', { name: '51.25 / -0.5' })).toHaveAttribute('href',
      'https://www.openstreetmap.org/?mlat=51.25&mlon=-0.5&zoom=12&marker=51.25/-0.5#map=13/51.25/-0.5');
    expect(screen.queryByText('Previous address')).not.toBeInTheDocument();
  });

  it.each([undefined, ''])('omits the address span when the latest address is %s', (address) => {
    const entries = [makeEntry(), makeEntry({ address })];
    const { container } = render(<Subinfo entries={entries} isLoggedIn fetchTimes={noFetchTimes} />);

    expect(Array.from(container.children, element => element.textContent)).toEqual([
      'GPS:', '50 / 8', 'Instant',
    ]);
    expect(container.querySelectorAll('span.info')).toHaveLength(1);
    expect(screen.queryByText('Test Street, Test Town')).not.toBeInTheDocument();
  });

  it.each([{ lat: 0, lon: 8 }, { lat: 50, lon: 0 }, { lat: 0, lon: 0 }])('preserves zero coordinates ($lat / $lon)', ({ lat, lon }) => {
    render(<Subinfo entries={[makeEntry({ lat, lon })]} isLoggedIn fetchTimes={noFetchTimes} />);

    expect(screen.getByText('GPS:')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `${lat} / ${lon}` })).toHaveAttribute('href',
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=12&marker=${lat}/${lon}#map=13/${lat}/${lon}`);
  });

  it('uses relative time while logged in and the stored time string after logout', () => {
    const entry = makeEntry();
    entry.time = { ...entry.time, created: now - 120000, createdString: '11:58:00' };
    const { rerender } = render(<Subinfo entries={[entry]} isLoggedIn fetchTimes={noFetchTimes} />);

    expect(screen.getByText('2 minutes ago')).toHaveClass('info');
    expect(screen.queryByText('11:58:00')).not.toBeInTheDocument();

    vi.setSystemTime(now + 60000);
    rerender(<Subinfo entries={[entry]} isLoggedIn fetchTimes={noFetchTimes} />);
    expect(screen.getByText('3 minutes ago')).toHaveClass('info');

    rerender(<Subinfo entries={[entry]} isLoggedIn={false} fetchTimes={noFetchTimes} />);
    expect(screen.getByText('11:58:00')).toHaveClass('info');
    expect(screen.queryByText('3 minutes ago')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '50 / 8' })).toBeInTheDocument();
    expect(screen.getByText(entry.address!)).toBeInTheDocument();
  });

  it.each([
    { isLoggedIn: false, last: now, next: now + 55000 },
    { isLoggedIn: true, last: undefined, next: now + 55000 },
    { isLoggedIn: true, last: now, next: undefined },
  ])('hides fetch progress without login or both timestamps: %j', ({ isLoggedIn, last, next }) => {
    render(<Subinfo entries={[makeEntry()]} isLoggedIn={isLoggedIn} fetchTimes={{ last, next }} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('shows determinate progress on the 300ms interval, accepts the next polling window, and hides it on logout', async () => {
    const { rerender } = render(<Subinfo entries={[]} isLoggedIn fetchTimes={{ last: now, next: now + 55000 }} />);
    await act(async () => { await vi.dynamicImportSettled(); });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveClass('MuiLinearProgress-determinate');
    expect(bar).toHaveAttribute('aria-valuenow', '0');

    act(() => { vi.advanceTimersByTime(299); });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    act(() => { vi.advanceTimersByTime(1); });
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    act(() => { vi.advanceTimersByTime(26700); });
    expect(bar).toHaveAttribute('aria-valuenow', '49');
    act(() => { vi.advanceTimersByTime(28200); });
    expect(bar).toHaveAttribute('aria-valuenow', '100');

    const fetchTimes = { last: Date.now(), next: Date.now() + 55000 };
    rerender(<Subinfo entries={[]} isLoggedIn fetchTimes={fetchTimes} />);
    act(() => { vi.advanceTimersByTime(300); });
    expect(bar).toHaveAttribute('aria-valuenow', '1');

    rerender(<Subinfo entries={[]} isLoggedIn={false} fetchTimes={fetchTimes} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
