import { isValid } from 'date-fns/isValid';
import { describe, expect, it } from 'vitest';
import {
  DATE_FORMAT,
  hoursBetween,
  matchesFormat,
  parseDateTime,
  TIME_FORMAT,
} from './localDateTime';

describe('parseDateTime', () => {
  it("reads a booking's date and time as local time", () => {
    expect(parseDateTime('2026-10-03', '09:05')).toEqual(new Date(2026, 9, 3, 9, 5));
  });

  it('returns an invalid Date for an impossible date or time', () => {
    expect(isValid(parseDateTime('2026-02-30', '09:00'))).toBe(false);
    expect(isValid(parseDateTime('2026-10-03', '24:00'))).toBe(false);
  });
});

describe('matchesFormat', () => {
  it('accepts real dates, including leap days', () => {
    expect(matchesFormat('2026-10-03', DATE_FORMAT)).toBe(true);
    expect(matchesFormat('2028-02-29', DATE_FORMAT)).toBe(true);
  });

  it('rejects impossible dates and loose formats that date-fns isMatch would allow', () => {
    for (const value of ['2026-02-30', '2027-02-29', '2026-13-01', '2026-1-5', '2026-10-03 ', '']) {
      expect(matchesFormat(value, DATE_FORMAT), value).toBe(false);
    }
  });

  it('accepts 24-hour HH:mm times only', () => {
    for (const value of ['00:00', '09:30', '23:59']) {
      expect(matchesFormat(value, TIME_FORMAT), value).toBe(true);
    }
    for (const value of ['24:00', '9:30', '09:60', '9:30 AM', '']) {
      expect(matchesFormat(value, TIME_FORMAT), value).toBe(false);
    }
  });
});

describe('hoursBetween', () => {
  it('counts the hours from a start time to an end time', () => {
    expect(hoursBetween('09:00', '17:00')).toBe(8);
    expect(hoursBetween('09:30', '12:00')).toBe(2.5);
    expect(hoursBetween('12:00', '09:00')).toBe(-3);
  });

  it('returns NaN when a time is missing', () => {
    expect(hoursBetween('', '17:00')).toBeNaN();
  });
});
