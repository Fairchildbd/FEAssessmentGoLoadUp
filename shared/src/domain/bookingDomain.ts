export const ANIMAL_TYPES = ['dog', 'cat', 'pig'] as const;
export type AnimalType = (typeof ANIMAL_TYPES)[number];

export function formatNameList(names: readonly string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
}

export const ANIMAL_TYPE_LABELS: Record<AnimalType, string> = {
  dog: 'Dog',
  cat: 'Cat',
  pig: 'Pig',
};

export const BOOKING_RULES = {
  minHours: 2,
  maxHours: 8,
  serviceHours: { start: '07:00', end: '21:00' },
  timeStepMinutes: 30,
  maxNameLength: 50,
} as const;

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  customerId: string;
  name: string;
  animalType: AnimalType;
  createdAt: string;
}

export interface PricingRules {
  currency: 'USD';
  baseChargeCents: number;
  hourlyRateCents: Record<AnimalType, number>;
}

export interface PetCharge {
  petId: string;
  hourlyRateCents: number;
  subtotalCents: number;
}

export interface PriceBreakdown {
  currency: 'USD';
  baseChargeCents: number;
  hours: number;
  pets: PetCharge[];
  totalCents: number;
}

export interface Booking {
  id: string;
  customerId: string;
  petIds: string[];
  serviceDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  hoursRequested: number;
  price: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
