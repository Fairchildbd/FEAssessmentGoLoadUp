import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {
  useBookingForm,
  type BookingFormValues,
  type BookingRequest,
} from '@pet-sitting/shared/booking-form';
import { getDeviceTimeZone } from '@pet-sitting/shared/date-time';
import { createBooking, MockApiError } from '@pet-sitting/shared/mock-api';
import { formatNameList } from '@pet-sitting/shared/domain';
import { mockDatabase } from '@pet-sitting/shared/mock-database';
import { useState, type ReactNode } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Link } from 'react-router';
import { WebPetFields } from '../booking-form/WebPetFields';
import { WebPriceSummary } from '../booking-form/WebPriceSummary';
import { WebServiceDateField } from '../booking-form/WebServiceDateField';
import { WebServiceTimeField } from '../booking-form/WebServiceTimeField';

const { pricingRules } = mockDatabase;

export function WebBookingPage() {
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
  const bookedPetNames = submitted ? formatNameList(submitted.pets.map((pet) => pet.name)) : '';
  const bookedDayLink = submitted ? `/admin?date=${submitted.serviceDate}` : '';
  const dismissSuccess = () => setSubmitted(null);

  return (
    <Container component="main" maxWidth="sm" className="py-xl">
      <Typography variant="h4" component="h1">
        Book a pet sitter
      </Typography>
      <Typography color="text.secondary" className="mt-xs">
        Add each pet you'd like sat, then choose a date and time.
      </Typography>

      {submitted && (
        <Alert severity="success" onClose={dismissSuccess} className="mt-lg">
          Booked {bookedPetNames}. <Link to={bookedDayLink}>See the day's bookings</Link>
        </Alert>
      )}

      <Card variant="outlined" className="mt-lg">
        <CardContent>
          <form
            noValidate
            aria-label="Book a pet sitter"
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-lg"
          >
            <FormSection title="Your name">
              <div className="grid gap-md sm:grid-cols-2">
                <NameField
                  control={control}
                  name="firstName"
                  label="First name"
                  autoComplete="given-name"
                />
                <NameField
                  control={control}
                  name="lastName"
                  label="Last name"
                  autoComplete="family-name"
                />
              </div>
            </FormSection>

            <FormSection title="Your pets">
              <WebPetFields control={control} pets={pets} />
            </FormSection>

            <FormSection title="When">
              <div className="grid gap-md sm:grid-cols-2">
                <WebServiceDateField control={control} />
                <WebServiceTimeField control={control} />
              </div>
            </FormSection>

            <WebPriceSummary control={control} pricingRules={pricingRules} />

            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitDisabled}
              className="rounded-pill"
            >
              {submitButtonText}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex flex-col gap-md border-0 p-0">
      <Typography component="legend" variant="h6" className="mb-md p-0">
        {title}
      </Typography>
      {children}
    </fieldset>
  );
}

interface NameFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  name: 'firstName' | 'lastName';
  label: string;
  autoComplete: string;
}

function NameField({ control, name, label, autoComplete }: NameFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const errorMessage = fieldState.error?.message;
        return (
          <TextField
            {...field}
            inputRef={field.ref}
            label={label}
            autoComplete={autoComplete}
            error={Boolean(errorMessage)}
            helperText={errorMessage}
          />
        );
      }}
    />
  );
}
