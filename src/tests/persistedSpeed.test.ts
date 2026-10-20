import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import os from 'os';
import path from 'path';
import { response } from 'express';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PopupSpeed from '../client/components/Popup_speed';
import { readAsJson } from '../scripts/file';
import { getMaxSpeedSeverity } from '../scripts/maxSpeed';
import { entry } from '../models/entry';

// Persisted entries as stored on disk: older files hold `maxSpeed` as a plain number (km/h limit).
type PersistedEntry = Omit<Models.IEntry, 'speed'> & {
  speed: Omit<Models.ISpeed, 'maxSpeed'> & { maxSpeed?: number | Models.IMaxSpeed },
};

const persistedEntry = (index: number, speed: PersistedEntry['speed'], ignore = false): PersistedEntry => ({
  index, user: 'TE', lat: 52 + index / 1000, lon: 13, altitude: 0, heading: 0, hdop: 2, ignore, address: '',
  time: { created: index * 15000, recieved: index * 15000, uploadDuration: 0, createdString: '' },
  distance: { horizontal: 0, vertical: 0, total: 0 },
  speed,
});

// Limit 100, hdop 2: warning above 104 km/h, alert above 112 km/h.
const persisted: { entries: PersistedEntry[] } = {
  entries: [
    persistedEntry(0, { gps: 10, total: 0, maxSpeed: 100 }), // legacy number, 36 km/h -> no flag
    persistedEntry(1, { gps: 29.5, maxSpeed: 100 }), // legacy number, 106 km/h -> warning
    persistedEntry(2, { gps: 20, total: 80, maxSpeed: 80 }, true), // legacy number, ignored, harmonic mean 115 km/h -> alert
    persistedEntry(3, { gps: 0, total: 0, maxSpeed: { value: 90, warning: false, alert: false } }), // already modern, untouched
    persistedEntry(4, { gps: 0, total: 0 }), // no limit known
    persistedEntry(5, { gps: 0, total: 0, maxSpeed: 0 }), // legacy limit of 0
  ],
};

let directory: string;
let filePath: string;
const loadEntries = () => readAsJson(response, filePath, error => { throw error; });

beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'persisted-speed-'));
  filePath = path.join(directory, 'entries.json');
  await writeFile(filePath, JSON.stringify(persisted, null, 2));
});

afterAll(() => rm(directory, { recursive: true, force: true }));

describe('persisted speed limits', () => {
  it('normalizes mixed legacy limits without changing modern records, other fields or the file', async () => {
    const before = await readFile(filePath, 'utf8');
    const loaded = await loadEntries();
    expect(loaded).toEqual({
      entries: persisted.entries.map(record => ({
        ...record,
        speed: {
          ...record.speed,
          ...(typeof record.speed.maxSpeed === 'number'
            ? { maxSpeed: getMaxSpeedSeverity(record, record.speed.maxSpeed) }
            : {}),
        },
      })),
    });
    expect(loaded!.entries.map(record => record.speed.maxSpeed)).toEqual([
      { value: 100, warning: false, alert: false },
      { value: 100, warning: true, alert: false },
      { value: 80, warning: true, alert: true },
      { value: 90, warning: false, alert: false },
      undefined,
      { value: 0, warning: false, alert: false },
    ]);
    expect(loaded!.entries[3]).toEqual(persisted.entries[3]);
    expect(await readFile(filePath, 'utf8')).toBe(before);
  });

  it('renders legacy and modern limits and their severity after read-response serialization', async () => {
    const loaded = await loadEntries();
    // /read sends these entries directly; exercise the JSON boundary and real popup together.
    const body: Models.IEntries = JSON.parse(JSON.stringify({ entries: loaded!.entries }));
    const expected = [
      '<span class="">100.0 km/h</span>',
      '<span class="warning">100.0 km/h</span>',
      '<span class="alert">80.0 km/h</span>',
      '<span class="">90.0 km/h</span>',
      undefined,
      '<span class="">0.0 km/h</span>',
    ];
    body.entries.forEach((record, index) => {
      const html = renderToStaticMarkup(createElement(PopupSpeed, { entry: record }));
      if (expected[index]) {
        expect(html).toContain(`<dt>MaxSpeed</dt><dd>${expected[index]}</dd>`);
      } else {
        expect(html).not.toContain('MaxSpeed');
      }
    });
  });

  it.each([undefined, 'before', 'after'] as const)('retains limits through read-to-recalculate (%s)', async direction => {
    const loaded = (await loadEntries())!;
    const original = structuredClone(loaded);
    const recalculated = entry.recalculate(loaded.entries, 1, direction);
    expect(recalculated.map(record => record.speed.maxSpeed?.value)).toEqual([100, 100, 80, 90, undefined, 0]);
    recalculated.filter(record => !record.ignore && record.speed.maxSpeed).forEach(record => {
      expect(record.speed.maxSpeed).toEqual(getMaxSpeedSeverity(record, record.speed.maxSpeed!.value));
    });
    expect(loaded).toEqual(original);
  });
});
