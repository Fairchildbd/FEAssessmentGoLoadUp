import {
  useBookingForm,
  type BookingFormValues,
  type BookingRequest,
} from '@pet-sitting/shared/booking-form';
import { getDeviceTimeZone } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { createBooking, MockApiError } from '@pet-sitting/shared/mock-api';
import { formatNameList } from '@pet-sitting/shared/domain';
import { mockDatabase } from '@pet-sitting/shared/mock-database';
import { useState, type ReactNode } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Banner, Button, Card, HelperText, Text, TextInput } from 'react-native-paper';
import { MobilePetFields } from '../booking-form/MobilePetFields';
import { MobilePriceSummary } from '../booking-form/MobilePriceSummary';
import { MobileServiceDateField } from '../booking-form/MobileServiceDateField';
import { MobileServiceTimeField } from '../booking-form/MobileServiceTimeField';

const { color, spacing } = designTokens;

const { pricingRules } = mockDatabase;

interface MobileBookingScreenProps {
  onShowDay: (serviceDate: string) => void;
}

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
      const message =
        error instanceof MockApiError ? error.message : 'Something went wrong. Please try again.';
      setError('root.server', { message });
    }
  };
  const serverError = formState.errors.root?.server?.message;
  const submitButtonText = formState.isSubmitting ? 'Booking…' : 'Request a sitter';
  const isSubmitDisabled = !formState.isValid || formState.isSubmitting;
  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;
  const isBooked = submitted !== null;
  const bookedMessage = submitted
    ? `Booked ${formatNameList(submitted.pets.map((pet) => pet.name))}.`
    : '';
  const dismissSuccess = () => setSubmitted(null);
  const showBookedDay = () => {
    if (submitted) onShowDay(submitted.serviceDate);
    dismissSuccess();
  };
  const bannerActions = [
    { label: 'Dismiss', onPress: dismissSuccess },
    { label: "See the day's bookings", onPress: showBookedDay },
  ];

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={keyboardBehavior}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" accessibilityRole="header">
          Book a pet sitter
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Add each pet you&apos;d like sat, then choose a date and time.
        </Text>

        <Banner visible={isBooked} icon="check-circle-outline" actions={bannerActions}>
          {bookedMessage}
        </Banner>

        <Card mode="outlined">
          <Card.Content style={styles.form}>
            <Section title="Your name">
              <NameField
                control={control}
                name="firstName"
                label="First name"
                autoComplete="given-name"
                textContentType="givenName"
              />
              <NameField
                control={control}
                name="lastName"
                label="Last name"
                autoComplete="family-name"
                textContentType="familyName"
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

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitDisabled}
              loading={formState.isSubmitting}
              contentStyle={styles.submit}
            >
              {submitButtonText}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface NameFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  name: 'firstName' | 'lastName';
  label: string;
  autoComplete: 'given-name' | 'family-name';
  textContentType: 'givenName' | 'familyName';
}

function NameField({ control, name, label, autoComplete, textContentType }: NameFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <View>
            <TextInput
              mode="outlined"
              label={label}
              accessibilityLabel={label}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              autoComplete={autoComplete}
              textContentType={textContentType}
              error={Boolean(errorMessage)}
            />
            {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}
          </View>
        );
      }}
    />
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
