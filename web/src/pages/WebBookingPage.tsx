import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useBookingForm, type BookingRequest } from '@pet-sitting/shared/booking-form';
import { mockDatabase } from '@pet-sitting/shared/mock-database';
import { useState, type ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import { WebPetFields } from '../booking-form/WebPetFields';
import { WebPriceSummary } from '../booking-form/WebPriceSummary';
import { WebServiceDateField } from '../booking-form/WebServiceDateField';
import { WebServiceTimeField } from '../booking-form/WebServiceTimeField';

// The rate card from the mock database. There's no API call yet: the form reads it directly.
const { pricingRules } = mockDatabase;

/** The booking form: who you are, your pets, when, and the live price. Validation is all client-side. */
export function WebBookingPage() {
  const { control, handleSubmit, formState, reset, pets } = useBookingForm();
  const [submitted, setSubmitted] = useState<BookingRequest | null>(null);

  // Submit stays disabled until every input is filled in and valid. isValid runs the schema on
  // every change, while each field's error message still waits until the user leaves it.

  const onSubmit = (request: BookingRequest) => {
    // Sending the request (and checking for overlapping bookings) comes next.
    setSubmitted(request);
    reset();
  };

  return (
    <Container component="main" maxWidth="sm" className="py-xl">
      <Typography variant="h4" component="h1">
        Book a pet sitter
      </Typography>
      <Typography color="text.secondary" className="mt-xs">
        Add each pet you'd like sat, then choose a date and time.
      </Typography>

      {submitted && (
        <Alert severity="success" onClose={() => setSubmitted(null)} className="mt-lg">
          Request received for {submitted.pets.map((pet) => pet.name).join(' and ')}.
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
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      inputRef={field.ref}
                      label="First name"
                      autoComplete="given-name"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      inputRef={field.ref}
                      label="Last name"
                      autoComplete="family-name"
                      error={Boolean(fieldState.error)}
                      helperText={fieldState.error?.message}
                    />
                  )}
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!formState.isValid || formState.isSubmitting}
              className="rounded-pill"
            >
              Request a sitter
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
