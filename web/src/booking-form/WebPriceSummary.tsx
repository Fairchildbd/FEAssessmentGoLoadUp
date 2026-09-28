import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import {
  useBookingQuote,
  type BookingFormValues,
  type BookingRequest,
} from '@pet-sitting/shared/booking-form';
import { ANIMAL_TYPE_LABELS, type PricingRules } from '@pet-sitting/shared/domain';
import { formatCents } from '@pet-sitting/shared/pricing';
import { useWatch, type Control } from 'react-hook-form';

interface WebPriceSummaryProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  pricingRules: PricingRules;
}

const pluralHours = (hours: number) => `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

/**
 * The itemized price: each pet with its hours and hourly rate listed under its name, the base
 * charge once for the whole request, and the total. It updates as pets and times change.
 */
export function WebPriceSummary({ control, pricingRules }: WebPriceSummaryProps) {
  const pets = useWatch({ control, name: 'pets' });
  const quote = useBookingQuote(control, pricingRules);

  return (
    <section aria-labelledby="price-heading" className="flex flex-col gap-sm">
      <Typography id="price-heading" variant="h6" component="h2">
        Price
      </Typography>

      <ul className="m-0 flex list-none flex-col gap-sm p-0">
        {pets.map((pet, index) => {
          const petQuote = quote.pets[index];
          const name = pet.name.trim() || `Pet ${index + 1}`;
          const type = pet.animalType ? ANIMAL_TYPE_LABELS[pet.animalType] : null;

          return (
            <li key={index} aria-label={`${name} price`} className="flex justify-between gap-md">
              <div>
                <Typography className="font-medium">
                  {name}
                  {type && <span className="text-on-surface-variant"> ({type})</span>}
                </Typography>
                <div className="text-body-small text-on-surface-variant">
                  {!pet.animalType ? (
                    <div>Choose an animal type</div>
                  ) : (
                    <>
                      <div>{petQuote ? pluralHours(petQuote.hours) : 'Choose a time'}</div>
                      <div>
                        {formatCents(pricingRules.hourlyRateCents[pet.animalType])} per hour
                      </div>
                    </>
                  )}
                </div>
              </div>
              {petQuote && <Typography>{formatCents(petQuote.subtotalCents)}</Typography>}
            </li>
          );
        })}

        <li className="flex justify-between gap-md">
          <div>
            <Typography className="font-medium">Base charge</Typography>
            <div className="text-body-small text-on-surface-variant">Once per request</div>
          </div>
          <Typography>{formatCents(pricingRules.baseChargeCents)}</Typography>
        </li>
      </ul>

      <Divider />

      <div className="flex items-baseline justify-between gap-md" aria-live="polite">
        <Typography variant="h6" component="p">
          Total
        </Typography>
        <Typography variant="h6" component="p" data-testid="total-price">
          {formatCents(quote.totalCents)}
        </Typography>
      </div>
    </section>
  );
}
