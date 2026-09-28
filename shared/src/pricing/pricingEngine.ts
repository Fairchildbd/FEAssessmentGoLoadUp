import type { AnimalType, PricingRules } from '../domain/bookingDomain';

/**
 * Pricing engine: turns a sitting request into an itemized quote. Pure functions over the rate card,
 * so web and mobile show the same numbers and the tests need no React.
 *
 * The base charge is per request, not per pet: one dog or twenty, it's charged once. Each pet then
 * adds its own hourly rate times the hours.
 */

/** One pet's line on the quote. */
export interface PetQuote {
  animalType: AnimalType;
  hours: number;
  hourlyRateCents: number;
  subtotalCents: number;
}

export interface BookingQuote {
  currency: PricingRules['currency'];
  /** Charged once per request. */
  baseChargeCents: number;
  /**
   * In the same order as the pets passed in. null for a pet that can't be priced yet: no animal type
   * chosen, or no time picked.
   */
  pets: (PetQuote | null)[];
  /** Base charge plus every priced pet. */
  totalCents: number;
}

/** `hours` is null until a time is picked; the total is then just the base charge. */
export function quoteBooking(
  animalTypes: readonly (AnimalType | null)[],
  hours: number | null,
  rules: PricingRules,
): BookingQuote {
  const pets = animalTypes.map((animalType): PetQuote | null => {
    if (animalType === null || hours === null) return null;
    const hourlyRateCents = rules.hourlyRateCents[animalType];
    // Rounded to whole cents, since half hours can halve an odd rate.
    const subtotalCents = Math.round(hourlyRateCents * hours);
    return { animalType, hours, hourlyRateCents, subtotalCents };
  });

  const petsTotalCents = pets.reduce((sum, pet) => sum + (pet?.subtotalCents ?? 0), 0);

  return {
    currency: rules.currency,
    baseChargeCents: rules.baseChargeCents,
    pets,
    totalCents: rules.baseChargeCents + petsTotalCents,
  };
}

/** Formats integer cents as money: 2000 -> '$20', 2050 -> '$20.50'. */
export function formatCents(cents: number, currency: PricingRules['currency'] = 'USD'): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
