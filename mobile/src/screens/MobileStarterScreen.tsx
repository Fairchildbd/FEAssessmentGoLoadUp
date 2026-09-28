import { useBookingForm } from '@pet-sitting/shared/booking-form';
import { DATE_FORMAT, getDeviceTimeZone } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { mockDatabase } from '@pet-sitting/shared/mock-database';
import { format } from 'date-fns/format';
import { useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const { color, radius, spacing, typography } = designTokens;

/**
 * Temporary starter screen that proves mobile/ is wired to shared/ and React Native Paper.
 * Replace it with the booking form screen (e.g. screens/MobileBookingScreen.tsx).
 */
export function MobileStarterScreen() {
  const { control } = useBookingForm();
  const pets = useWatch({ control, name: 'pets' });

  return (
    <SafeAreaView style={styles.screen}>
      <Text variant="headlineMedium" role="heading">
        Pet Sitting
      </Text>
      <Text variant="bodyMedium" style={styles.secondaryText}>
        Mobile starter: shared/ and React Native Paper are wired up. Replace this screen with the
        booking form.
      </Text>

      <Card mode="outlined">
        <Card.Title title="From shared/" titleVariant="titleMedium" />
        <Card.Content style={styles.cardContent}>
          <Text>
            Mock database: {mockDatabase.pets.length} pets, {mockDatabase.bookings.length} bookings
          </Text>
          <Text>useBookingForm() (React Hook Form): starts with {pets.length} pet</Text>
          <Text>
            date-fns: today is {format(new Date(), DATE_FORMAT)} in {getDeviceTimeZone()}
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>StyleSheet values from the shared design tokens</Text>
      </View>

      <Button mode="contained">Paper button using the primary token</Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: color.background,
  },
  secondaryText: {
    color: color.onSurfaceVariant,
  },
  cardContent: {
    gap: spacing.sm,
  },
  banner: {
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: color.secondaryContainer,
  },
  bannerText: {
    color: color.onSecondaryContainer,
    fontSize: typography.fontSize.bodySmall,
  },
});
