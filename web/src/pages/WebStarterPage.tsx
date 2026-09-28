import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useBookingForm } from '@pet-sitting/shared/booking-form';
import { mockDatabase } from '@pet-sitting/shared/mock-database';

/**
 * Temporary starter page that proves web/ is wired to shared/, MUI and Tailwind.
 * Replace it with the booking form page (e.g. pages/WebBookingPage.tsx).
 */
export function WebStarterPage() {
  const { values } = useBookingForm();

  return (
    <Container component="main" maxWidth="sm" className="py-xl">
      <Typography variant="h4" component="h1">
        Pet Sitting
      </Typography>
      <Typography color="text.secondary" className="mt-xs">
        Web starter: shared/, MUI and Tailwind are wired up. Replace this page with the booking
        form.
      </Typography>

      <Card variant="outlined" className="mt-lg">
        <CardContent className="flex flex-col gap-sm">
          <Typography variant="h6" component="h2">
            From shared/
          </Typography>
          <Typography>
            Mock database: {mockDatabase.pets.length} pets, {mockDatabase.bookings.length} bookings
          </Typography>
          <Typography>useBookingForm(): hours start at {values.hoursRequested}</Typography>
        </CardContent>
      </Card>

      <p className="mt-lg rounded-control bg-secondary-container px-md py-sm text-body-small text-on-secondary-container">
        Tailwind classes built from the shared design tokens
      </p>

      <Button variant="contained" className="mt-md rounded-pill">
        MUI button, rounded by a Tailwind class
      </Button>
    </Container>
  );
}
