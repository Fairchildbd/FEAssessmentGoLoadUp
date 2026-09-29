import { describe, expect, it } from 'vitest';
import { formatNameList } from './bookingDomain';

describe('formatNameList', () => {
  it('joins names the way a sentence would', () => {
    expect(formatNameList(['Oscar'])).toBe('Oscar');
    expect(formatNameList(['Oscar', 'Sulley'])).toBe('Oscar and Sulley');
    expect(formatNameList(['Oscar', 'Sulley', 'Babe'])).toBe('Oscar, Sulley, and Babe');
  });
});
