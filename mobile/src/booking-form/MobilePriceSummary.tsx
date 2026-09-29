import {
  useBookingQuote,
  type BookingFormValues,
  type BookingRequest,
  type PetFormValues,
} from '@pet-sitting/shared/booking-form';
import { formatHours } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { ANIMAL_TYPE_LABELS, type PricingRules } from '@pet-sitting/shared/domain';
import { formatCents, type PetQuote } from '@pet-sitting/shared/pricing';
import { useWatch, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

const { color, spacing } = designTokens;

interface MobilePriceSummaryProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  pricingRules: PricingRules;
}

export function MobilePriceSummary({ control, pricingRules }: MobilePriceSummaryProps) {
  const pets = useWatch({ control, name: 'pets' });
  const quote = useBookingQuote(control, pricingRules);
  const baseCharge = formatCents(pricingRules.baseChargeCents);
  const total = formatCents(quote.totalCents);

  return (
    <View style={styles.summary}>
      <Text variant="titleMedium" accessibilityRole="header">
        Price
      </Text>

      {pets.map((pet, index) => (
        <PetPriceRow
          key={index}
          pet={pet}
          fallbackName={`Pet ${index + 1}`}
          petQuote={quote.pets[index]}
          pricingRules={pricingRules}
        />
      ))}

      <View style={styles.row}>
        <View>
          <Text variant="bodyLarge">Base charge</Text>
          <Text variant="bodySmall" style={styles.muted}>
            Once per request
          </Text>
        </View>
        <Text variant="bodyLarge">{baseCharge}</Text>
      </View>

      <Divider />

      <View style={styles.row} accessibilityLiveRegion="polite">
        <Text variant="titleLarge">Total</Text>
        <Text variant="titleLarge" testID="total-price">
          {total}
        </Text>
      </View>
    </View>
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
    <View style={styles.row} accessibilityLabel={`${name} price`}>
      <View>
        <Text variant="bodyLarge">
          {name}
          {animalLabel ? <Text style={styles.muted}>{animalLabel}</Text> : null}
        </Text>
        {animalType ? (
          <>
            <Text variant="bodySmall" style={styles.muted}>
              {hoursText}
            </Text>
            <Text variant="bodySmall" style={styles.muted}>
              {hourlyRate}
            </Text>
          </>
        ) : (
          <Text variant="bodySmall" style={styles.muted}>
            Choose an animal type
          </Text>
        )}
      </View>
      {subtotal ? <Text variant="bodyLarge">{subtotal}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  muted: { color: color.onSurfaceVariant },
});
