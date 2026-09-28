import { describe, expect, it } from 'vitest';
import type { PricingRules } from '../domain/bookingDomain';
import { formatCents, quoteBooking } from './pricingEngine';

const rules: PricingRules = {
  currency: 'USD',
  baseChargeCents: 2000,
  hourlyRateCents: { dog: 1000, cat: 500, pig: 2000 },
};

describe('quoteBooking', () => {
  it('adds the base charge to one pet at its hourly rate', () => {
    const quote = quoteBooking(['pig'], 8, rules);

    expect(quote.pets).toEqual([
      { animalType: 'pig', hours: 8, hourlyRateCents: 2000, subtotalCents: 16000 },
    ]);
    expect(quote.totalCents).toBe(18000);
  });

  it('charges the base once per request, however many pets', () => {
    const quote = quoteBooking(['dog', 'dog'], 3, rules);

    expect(quote.baseChargeCents).toBe(2000);
    expect(quote.pets.map((pet) => pet?.subtotalCents)).toEqual([3000, 3000]);
    expect(quote.totalCents).toBe(2000 + 3000 + 3000);
  });

  it('prices each animal type at its own rate', () => {
    const quote = quoteBooking(['dog', 'cat', 'pig'], 2, rules);

    expect(quote.pets.map((pet) => pet?.hourlyRateCents)).toEqual([1000, 500, 2000]);
    expect(quote.totalCents).toBe(2000 + 2000 + 1000 + 4000);
  });

  it('leaves a pet unpriced until its animal type is chosen', () => {
    const quote = quoteBooking(['cat', null], 4, rules);

    expect(quote.pets[1]).toBeNull();
    expect(quote.totalCents).toBe(2000 + 2000);
  });

  it('prices half hours', () => {
    expect(quoteBooking(['dog'], 2.5, rules).totalCents).toBe(2000 + 2500);
  });

  it('charges only the base until a time is picked', () => {
    const quote = quoteBooking(['dog', 'cat'], null, rules);

    expect(quote.pets).toEqual([null, null]);
    expect(quote.totalCents).toBe(2000);
  });

  it('charges only the base with no pets', () => {
    expect(quoteBooking([], 4, rules).totalCents).toBe(2000);
  });
});

describe('formatCents', () => {
  it('drops the cents for whole dollars and keeps them otherwise', () => {
    expect(formatCents(2000)).toBe('$20');
    expect(formatCents(123450)).toBe('$1,234.50');
    expect(formatCents(5)).toBe('$0.05');
  });
});
