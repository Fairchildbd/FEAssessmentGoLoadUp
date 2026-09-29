import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import {
  useBookingQuote,
  usePricingRules,
  type BookingFormValues,
  type BookingRequest,
  type PetFormValues,
} from '@pet-sitting/shared/booking-form';
import { formatHours } from '@pet-sitting/shared/date-time';
import { ANIMAL_TYPE_LABELS, type PricingRules } from '@pet-sitting/shared/domain';
import { formatCents, type PetQuote } from '@pet-sitting/shared/pricing';
import { useWatch, type Control } from 'react-hook-form';

interface WebPriceSummaryProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

export function WebPriceSummary({ control }: WebPriceSummaryProps) {
  const pets = useWatch({ control, name: 'pets' });
  const pricingRules = usePricingRules();
  const quote = useBookingQuote(control, pricingRules);

  if (!pricingRules || !quote) {
    return (
      <Typography color="text.secondary" aria-live="polite">
        Loading prices…
      </Typography>
    );
  }

  const baseCharge = formatCents(pricingRules.baseChargeCents);
  const total = formatCents(quote.totalCents);

  return (
    <section aria-labelledby="price-heading" className="flex flex-col gap-sm">
      <Typography id="price-heading" variant="h6" component="h2">
        Price
      </Typography>

      <ul className="m-0 flex list-none flex-col gap-sm p-0">
        {pets.map((pet, index) => (
          <PetPriceRow
            key={index}
            pet={pet}
            fallbackName={`Pet ${index + 1}`}
            petQuote={quote.pets[index]}
            pricingRules={pricingRules}
          />
        ))}

        <li className="flex justify-between gap-md">
          <div>
            <Typography className="font-medium">Base charge</Typography>
            <div className="text-body-small text-on-surface-variant">Once per request</div>
          </div>
          <Typography>{baseCharge}</Typography>
        </li>
      </ul>

      <Divider />

      <div className="flex items-baseline justify-between gap-md" aria-live="polite">
        <Typography variant="h6" component="p">
          Total
        </Typography>
        <Typography variant="h6" component="p" data-testid="total-price">
          {total}
        </Typography>
      </div>
    </section>
  );
}

interface PetPriceRowProps {
  pet: PetFormValues;
  fallbackName: string;
  petQuote: PetQuote | null | undefined;
  pricingRules: PricingRules;
}

function PetPriceRow({ pet, fallbackName, petQuote, pricingRules }: PetPriceRowProps) {
  const name = pet.name.trim() || fallbackName;
  const animalType = pet.animalType;
  const animalLabel = animalType ? ` (${ANIMAL_TYPE_LABELS[animalType]})` : '';
  const hoursText = petQuote ? formatHours(petQuote.hours) : 'Choose a time';
  const hourlyRate = animalType
    ? `${formatCents(pricingRules.hourlyRateCents[animalType])} per hour`
    : '';
  const subtotal = petQuote ? formatCents(petQuote.subtotalCents) : null;

  return (
    <li aria-label={`${name} price`} className="flex justify-between gap-md">
      <div>
        <Typography className="font-medium">
          {name}
          {animalLabel && <span className="text-on-surface-variant">{animalLabel}</span>}
        </Typography>
        <div className="text-body-small text-on-surface-variant">
          {animalType ? (
            <>
              <div>{hoursText}</div>
              <div>{hourlyRate}</div>
            </>
          ) : (
            <div>Choose an animal type</div>
          )}
        </div>
      </div>
      {subtotal && <Typography>{subtotal}</Typography>}
    </li>
  );
}
