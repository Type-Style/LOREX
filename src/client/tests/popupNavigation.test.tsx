import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, renderHook, screen } from '@testing-library/react';
import { PopupContent } from '../components/PopupContent';
import { ActionContext } from '../context';
import { usePopup } from '../hooks/usePopup';
import { makeEntry, renderWithContext } from './testUtils';

function renderPopup(entry: Models.IEntry) {
	const actionContext: client.ActionContext = { entries: [entry], setEntries: () => {}, showIgnored: false, setShowIgnored: () => {} };
	return renderWithContext(
		<ActionContext value={[actionContext]}>
			<PopupContent entry={entry} cleanEntries={[entry]} />
		</ActionContext>
	);
}

afterEach(() => {
	cleanup();
	vi.useRealTimers();
	window.history.replaceState({}, '', '/');
});

describe('popup URL close lifecycle', () => {
	const entryA = makeEntry({ index: 0 });
	const entryB = makeEntry({ index: 1 });
	const markerRef = { current: {} };

	beforeEach(() => {
		vi.useFakeTimers();
		window.history.replaceState({}, '', '/?tab=speed&keep=value#map');
	});

	it('retains the current popup for 500 ms, then removes only its parameter', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(150));
		act(() => result.current.closed(entryA, markerRef));
		act(() => vi.advanceTimersByTime(499));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
		act(() => vi.advanceTimersByTime(1));
		expect(window.location.search).toBe('?tab=speed&keep=value');
		expect(window.location.hash).toBe('#map');
	});

	it('does not let marker A close clear marker B opened by a separate hook instance', () => {
		const markerA = renderHook(usePopup);
		const markerB = renderHook(usePopup);
		act(() => markerA.result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(150));
		act(() => markerA.result.current.closed(entryA, markerRef));
		act(() => markerB.result.current.opened(entryB, markerRef));
		act(() => vi.advanceTimersByTime(501));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('1');
		expect(new URL(window.location.href).searchParams.get('tab')).toBe('speed');
		act(() => markerB.result.current.closed(entryB, markerRef));
		act(() => vi.advanceTimersByTime(500));
		expect(new URL(window.location.href).searchParams.has('popup')).toBe(false);
	});

	it('cancels its pending close immediately when the same marker reopens near the deadline', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(150));
		act(() => result.current.closed(entryA, markerRef));
		act(() => vi.advanceTimersByTime(499));
		act(() => result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(1));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
		act(() => vi.advanceTimersByTime(500));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
	});

	it('still closes a marker that closes immediately after opening', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => result.current.closed(entryA, markerRef));
		act(() => vi.advanceTimersByTime(500));
		expect(new URL(window.location.href).searchParams.has('popup')).toBe(false);
	});

	it('replaces its previous close timer instead of leaving an earlier deletion pending', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(150));
		act(() => result.current.closed(entryA, markerRef));
		act(() => vi.advanceTimersByTime(250));
		act(() => result.current.closed(entryA, markerRef));
		act(() => vi.advanceTimersByTime(250));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
		act(() => vi.advanceTimersByTime(250));
		expect(new URL(window.location.href).searchParams.has('popup')).toBe(false);
	});

	it('cancels its close timer on unmount', () => {
		const { result, unmount } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => vi.advanceTimersByTime(150));
		act(() => result.current.closed(entryA, markerRef));
		unmount();
		act(() => vi.advanceTimersByTime(500));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
	});
});

describe('popup tab navigation', () => {
	it.each([
		['speed', 'speed', 'GPS'],
		['distance', 'distance', 'Separation'],
		['time', 'time', 'Created'],
		['invalid', 'info', 'Lat / Lon'],
		['', 'info', 'Lat / Lon'],
	])('restores tab=%s independently of the popup index', (tab, selected, label) => {
		window.history.replaceState({}, '', `/?popup=7${tab ? `&tab=${tab}` : ''}&keep=value#map`);
		const entry = makeEntry({ index: 7 });
		renderPopup(entry);
		expect(screen.getByRole('tab', { name: selected })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText(label, { selector: 'dt' })).toBeVisible();
		const url = new URL(window.location.href);
		expect(url.searchParams.get('tab')).toBe(selected);
		expect(url.searchParams.get('popup')).toBe('7');
		expect(url.searchParams.get('keep')).toBe('value');
		expect(url.hash).toBe('#map');
	});

	it('writes a selected tab and restores it when popup content remounts', () => {
		window.history.replaceState({}, '', '/?popup=7&tab=speed');
		const entry = makeEntry({ index: 7 });
		const { unmount } = renderPopup(entry);
		fireEvent.click(screen.getByRole('tab', { name: 'distance' }));
		expect(new URL(window.location.href).searchParams.get('tab')).toBe('distance');
		unmount();
		renderPopup(entry);
		expect(screen.getByRole('tab', { name: 'distance' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByText('Separation', { selector: 'dt' })).toBeVisible();
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('7');
	});
});
