import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  endTimeForNewStart,
  endTimeOptions,
  hasStartPassed,
  startTimeOptions,
} from './serviceTimeOptions';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('startTimeOptions', () => {
  it('runs every half hour from opening to 2 hours before closing', () => {
    const starts = startTimeOptions();
    expect(starts[0]).toBe('07:00');
    expect(starts[1]).toBe('07:30');
    expect(starts.at(-1)).toBe('19:00');
    expect(starts).toHaveLength(25);
  });
});

describe('endTimeOptions', () => {
  it('lists only 2 to 8 hours after the start, every half hour', () => {
    const ends = endTimeOptions('09:00');
    expect(ends[0]).toBe('11:00');
    expect(ends.at(-1)).toBe('17:00');
    expect(ends).toHaveLength(13);
  });

  it('stops at closing, even when start + 8 hours passes midnight', () => {
    expect(endTimeOptions('18:00')).toEqual(['20:00', '20:30', '21:00']);
  });

  it('is empty until a start is chosen', () => {
    expect(endTimeOptions('')).toEqual([]);
  });
});

describe('endTimeForNewStart', () => {
  it('keeps the same number of hours when they still fit', () => {
    expect(endTimeForNewStart({ startTime: '09:00', endTime: '12:00' }, '10:30')).toBe('13:30');
  });

  it('clears the end when the hours no longer fit, or none were chosen', () => {
    expect(endTimeForNewStart({ startTime: '09:00', endTime: '17:00' }, '15:00')).toBe('');
    expect(endTimeForNewStart({ startTime: '09:00', endTime: '' }, '10:00')).toBe('');
  });
});

describe('hasStartPassed', () => {
  it("is true only for today's earlier times", () => {
    expect(hasStartPassed('2026-10-01', '11:30')).toBe(true);
    expect(hasStartPassed('2026-10-01', '12:30')).toBe(false);
    expect(hasStartPassed('2026-10-02', '07:00')).toBe(false);
    expect(hasStartPassed('', '07:00')).toBe(false);
  });
});
