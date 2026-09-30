import { readFile } from 'fs/promises';
import path from 'path';
import { response } from 'express';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PopupSpeed from '../client/components/Popup_speed';
import { readAsJson } from '../scripts/file';
import { getMaxSpeedSeverity } from '../scripts/maxSpeed';
import { entry } from '../models/entry';

const fixturePath = path.join(__dirname, 'fixtures/persistedSpeed.json');
const loadEntries = () => readAsJson(response, fixturePath, error => { throw error; });

describe('persisted speed limits', () => {
  it('normalizes mixed legacy limits without changing modern records, other fields or the file', async () => {
    const before = await readFile(fixturePath, 'utf8');
    const persisted = JSON.parse(before);
    const loaded = await loadEntries();
    expect(loaded).toEqual({
      entries: persisted.entries.map((record: Models.IEntry) => ({
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
    expect(await readFile(fixturePath, 'utf8')).toBe(before);
  });

  it('renders legacy and modern limits and their severity after read-response serialization', async () => {
    const loaded = await loadEntries();
    // /read sends these entries directly; exercise the JSON boundary and real popup together.
    const body: Models.IEntries = JSON.parse(JSON.stringify({ entries: loaded!.entries }));
    const expected = [
      '<span class="">100.0 km/h</span>',
      '<span class="main">100.0 km/h</span>',
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
