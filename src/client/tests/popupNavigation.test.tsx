import React from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
	window.history.replaceState({}, '', '/');
});

describe('popup URL close lifecycle', () => {
	const entryA = makeEntry({ index: 0 });
	const entryB = makeEntry({ index: 1 });
	const markerRef = { current: {} };

	beforeEach(() => {
		window.history.replaceState({}, '', '/?tab=speed&keep=value#map');
	});

	it('removes only its popup parameter on close', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('0');
		act(() => result.current.closed(entryA, markerRef));
		expect(window.location.search).toBe('?tab=speed&keep=value');
		expect(window.location.hash).toBe('#map');
	});

	it('does not let marker A close clear marker B opened by a separate hook instance', () => {
		const markerA = renderHook(usePopup);
		const markerB = renderHook(usePopup);
		act(() => markerA.result.current.opened(entryA, markerRef));
		act(() => markerB.result.current.opened(entryB, markerRef));
		act(() => markerA.result.current.closed(entryA, markerRef));
		expect(new URL(window.location.href).searchParams.get('popup')).toBe('1');
		act(() => markerB.result.current.closed(entryB, markerRef));
		expect(new URL(window.location.href).searchParams.has('popup')).toBe(false);
	});

	it('keeps the parameter when an unmounting marker (detached ref) closes', () => {
		const { result } = renderHook(usePopup);
		act(() => result.current.opened(entryA, markerRef));
		act(() => result.current.closed(entryA, { current: null }));
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
