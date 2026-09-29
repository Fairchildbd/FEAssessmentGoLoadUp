import type { AnimalType, PricingRules } from '../domain/bookingDomain';

export interface PetQuote {
  animalType: AnimalType;
  hours: number;
  hourlyRateCents: number;
  subtotalCents: number;
}

export interface BookingQuote {
  currency: PricingRules['currency'];
  baseChargeCents: number;
  pets: (PetQuote | null)[];
  totalCents: number;
}

export function quoteBooking(
  animalTypes: readonly (AnimalType | null)[],
  hours: number | null,
  rules: PricingRules,
): BookingQuote {
  const pets = animalTypes.map((animalType): PetQuote | null => {
    if (animalType === null || hours === null) return null;
    const hourlyRateCents = rules.hourlyRateCents[animalType];
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

export function formatCents(cents: number, currency: PricingRules['currency'] = 'USD'): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
