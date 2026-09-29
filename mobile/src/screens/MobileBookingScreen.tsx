import { useBookingForm, type BookingRequest } from '@pet-sitting/shared/booking-form';
import { getDeviceTimeZone } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { createBooking, MockApiError } from '@pet-sitting/shared/mock-api';
import { formatNameList } from '@pet-sitting/shared/domain';
import { mockDatabase } from '@pet-sitting/shared/mock-database';
import { useState, type ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { MobilePetFields } from '../booking-form/MobilePetFields';
import { MobilePriceSummary } from '../booking-form/MobilePriceSummary';
import { MobileServiceDateField } from '../booking-form/MobileServiceDateField';
import { MobileServiceTimeField } from '../booking-form/MobileServiceTimeField';

const { color, spacing } = designTokens;

// The rate card from the mock database's seed, read directly for the live price. Bookings are saved
// through the mock API, which prices them from the same rate card.
const { pricingRules } = mockDatabase;

interface MobileBookingScreenProps {
  /** Opens the admin tab on a date ('YYYY-MM-DD'). */
  onShowDay: (serviceDate: string) => void;
}

/**
 * The booking form, matching the web page: your name, your pets, when, and the live price, with the
 * same shared hook, rules and mock API. Validation is all on the device.
 */
export function MobileBookingScreen({ onShowDay }: MobileBookingScreenProps) {
  const { control, handleSubmit, formState, reset, setError, pets } = useBookingForm();
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);

  const onSubmit = async (request: BookingRequest) => {
    setSubmitted(null);
    try {
      await createBooking(request, getDeviceTimeZone());
      setSubmitted(request);
      reset();
    } catch (error) {
      // The server refused it (say, a pet is already booked then). Keep the form so it can be fixed.
      const message =
        error instanceof MockApiError ? error.message : 'Something went wrong. Please try again.';
      setError('root.server', { message });
    }
  };
  const serverError = formState.errors.root?.server?.message;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" accessibilityRole="header">
          Book a pet sitter
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Add each pet you&apos;d like sat, then choose a date and time.
        </Text>

        <Banner
          visible={submitted !== null}
          icon="check-circle-outline"
          actions={[
            { label: 'Dismiss', onPress: () => setSubmitted(null) },
            {
              label: "See the day's bookings",
              onPress: () => {
                if (submitted) onShowDay(submitted.serviceDate);
                setSubmitted(null);
              },
            },
          ]}
        >
          {submitted ? `Booked ${formatNameList(submitted.pets.map((pet) => pet.name))}.` : ''}
        </Banner>

        <Card mode="outlined">
          <Card.Content style={styles.form}>
            <Section title="Your name">
              <Controller
                name="firstName"
                control={control}
                render={({ field, fieldState }) => (
                  <View>
                    <TextInput
                      mode="outlined"
                      label="First name"
                      accessibilityLabel="First name"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      autoComplete="given-name"
                      textContentType="givenName"
                      error={Boolean(fieldState.error)}
                    />
                    {fieldState.error ? (
                      <HelperText type="error">{fieldState.error.message}</HelperText>
                    ) : null}
                  </View>
                )}
              />
              <Controller
                name="lastName"
                control={control}
                render={({ field, fieldState }) => (
                  <View>
                    <TextInput
                      mode="outlined"
                      label="Last name"
                      accessibilityLabel="Last name"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      autoComplete="family-name"
                      textContentType="familyName"
                      error={Boolean(fieldState.error)}
                    />
                    {fieldState.error ? (
                      <HelperText type="error">{fieldState.error.message}</HelperText>
                    ) : null}
                  </View>
                )}
              />
            </Section>

            <Section title="Your pets">
              <MobilePetFields control={control} pets={pets} />
            </Section>

            <Section title="When">
              <MobileServiceDateField control={control} />
              <MobileServiceTimeField control={control} />
            </Section>

            <MobilePriceSummary control={control} pricingRules={pricingRules} />

            {serverError ? (
              <HelperText type="error" accessibilityRole="alert" style={styles.serverError}>
                {serverError}
              </HelperText>
            ) : null}

            {/* Disabled until every input is filled in and valid, as on web. */}
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={!formState.isValid || formState.isSubmitting}
              loading={formState.isSubmitting}
              contentStyle={styles.submit}
            >
              {formState.isSubmitting ? 'Booking…' : 'Request a sitter'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  muted: { color: color.onSurfaceVariant },
  form: { gap: spacing.lg },
  section: { gap: spacing.sm },
  serverError: { fontSize: 14 },
  submit: { paddingVertical: spacing.xs },
});
