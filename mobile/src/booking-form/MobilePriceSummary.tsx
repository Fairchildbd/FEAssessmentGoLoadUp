import {
  useBookingQuote,
  type BookingFormValues,
  type BookingRequest,
} from '@pet-sitting/shared/booking-form';
import { formatHours } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { ANIMAL_TYPE_LABELS, type PricingRules } from '@pet-sitting/shared/domain';
import { formatCents } from '@pet-sitting/shared/pricing';
import { useWatch, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';

const { color, spacing } = designTokens;

interface MobilePriceSummaryProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  pricingRules: PricingRules;
}

/**
 * The itemized price, like the web summary: each pet with its hours and hourly rate listed under
 * its name, the base charge once for the whole request, and the total.
 */
export function MobilePriceSummary({ control, pricingRules }: MobilePriceSummaryProps) {
  const pets = useWatch({ control, name: 'pets' });
  const quote = useBookingQuote(control, pricingRules);

  return (
    <View style={styles.summary}>
      <Text variant="titleMedium" accessibilityRole="header">
        Price
      </Text>

      {pets.map((pet, index) => {
        const petQuote = quote.pets[index];
        const name = pet.name.trim() || `Pet ${index + 1}`;
        return (
          <View key={index} style={styles.row} accessibilityLabel={`${name} price`}>
            <View>
              <Text variant="bodyLarge">
                {name}
                {pet.animalType ? (
                  <Text style={styles.muted}> ({ANIMAL_TYPE_LABELS[pet.animalType]})</Text>
                ) : null}
              </Text>
              {!pet.animalType ? (
                <Text variant="bodySmall" style={styles.muted}>
                  Choose an animal type
                </Text>
              ) : (
                <>
                  <Text variant="bodySmall" style={styles.muted}>
                    {petQuote ? formatHours(petQuote.hours) : 'Choose a time'}
                  </Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    {formatCents(pricingRules.hourlyRateCents[pet.animalType])} per hour
                  </Text>
                </>
              )}
            </View>
            {petQuote ? (
              <Text variant="bodyLarge">{formatCents(petQuote.subtotalCents)}</Text>
            ) : null}
          </View>
        );
      })}

      <View style={styles.row}>
        <View>
          <Text variant="bodyLarge">Base charge</Text>
          <Text variant="bodySmall" style={styles.muted}>
            Once per request
          </Text>
        </View>
        <Text variant="bodyLarge">{formatCents(pricingRules.baseChargeCents)}</Text>
      </View>

      <Divider />

      <View style={styles.row} accessibilityLiveRegion="polite">
        <Text variant="titleLarge">Total</Text>
        <Text variant="titleLarge" testID="total-price">
          {formatCents(quote.totalCents)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  muted: { color: color.onSurfaceVariant },
});
