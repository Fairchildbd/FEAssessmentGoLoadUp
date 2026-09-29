import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import {
  dayEarningsCents,
  useDaySchedule,
  type StartTimeGroup,
} from '@pet-sitting/shared/booking-schedule';
import type { BookingListItem } from '@pet-sitting/shared/mock-api';
import {
  DATE_FORMAT,
  displayTime,
  formatHours,
  matchesFormat,
} from '@pet-sitting/shared/date-time';
import { ANIMAL_TYPE_LABELS, type Pet } from '@pet-sitting/shared/domain';
import { formatCents } from '@pet-sitting/shared/pricing';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { Fragment } from 'react';
import { useSearchParams } from 'react-router';
import { WebDatePicker } from '../components/WebDatePicker';

function useSelectedDate(): [string, (date: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get('date') ?? '';
  const date = matchesFormat(fromUrl, DATE_FORMAT) ? fromUrl : format(new Date(), DATE_FORMAT);
  const setDate = (next: string) => setSearchParams({ date: next });
  return [date, setDate];
}

export function WebAdminPage() {
  const [date, setDate] = useSelectedDate();
  const { schedule, reload } = useDaySchedule(date);

  const selectedDay = parse(date, DATE_FORMAT, new Date());
  const shiftDay = (days: number) => setDate(format(addDays(selectedDay, days), DATE_FORMAT));
  const showPreviousDay = () => shiftDay(-1);
  const showNextDay = () => shiftDay(1);
  const pickDay = (next: string) => next && setDate(next);
  const dayHeading = format(selectedDay, 'EEEE, MMMM d, yyyy');

  const isLoading = schedule.status === 'loading';
  const isError = schedule.status === 'error';
  const isLoaded = schedule.status === 'loaded';
  const formattedEarnings = isLoaded ? formatCents(dayEarningsCents(schedule.groups)) : '…';
  const hasNoBookings = isLoaded && schedule.groups.length === 0;

  return (
    <Container component="main" maxWidth="sm" className="py-xl">
      <div className="flex items-start justify-between gap-md">
        <div>
          <Typography variant="h4" component="h1">
            Bookings
          </Typography>
          <Typography color="text.secondary" className="mt-xs">
            {dayHeading}
          </Typography>
        </div>
        <div className="text-right" aria-live="polite">
          <Typography variant="h4" component="p" data-testid="day-earnings">
            {formattedEarnings}
          </Typography>
          <Typography color="text.secondary" className="mt-xs">
            Total earnings
          </Typography>
        </div>
      </div>

      <div className="mt-lg flex items-center gap-sm">
        <IconButton aria-label="Previous day" onClick={showPreviousDay}>
          <ChevronLeftIcon />
        </IconButton>
        <div className="flex-1">
          <WebDatePicker label="Day" value={date} onChange={pickDay} />
        </div>
        <IconButton aria-label="Next day" onClick={showNextDay}>
          <ChevronRightIcon />
        </IconButton>
      </div>

      <section aria-label="Schedule" aria-busy={isLoading} className="mt-lg">
        {isLoading && (
          <div className="flex justify-center py-xl">
            <CircularProgress aria-label="Loading bookings" />
          </div>
        )}

        {isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={reload}>
                Try again
              </Button>
            }
          >
            {schedule.message}
          </Alert>
        )}

        {hasNoBookings && (
          <Typography color="text.secondary" className="py-xl text-center">
            No bookings on this day.
          </Typography>
        )}

        {isLoaded && (
          <div className="flex flex-col gap-md">
            {schedule.groups.map((group) => (
              <StartTimeCard key={group.startTime} group={group} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}

function StartTimeCard({ group }: { group: StartTimeGroup }) {
  const count = group.items.length;
  const title = `${count} ${count === 1 ? 'appointment' : 'appointments'} starting at ${displayTime(group.startTime)}`;

  return (
    <Card variant="outlined" component="article" aria-label={title}>
      <CardContent className="flex flex-col gap-sm">
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <ul className="m-0 flex list-none flex-col gap-sm p-0">
          {group.items.map((item, index) => (
            <Fragment key={item.booking.id}>
              {index > 0 && <Divider component="li" aria-hidden />}
              <AppointmentItem item={item} />
            </Fragment>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AppointmentItem({ item: { booking, customer, pets } }: { item: BookingListItem }) {
  const customerName = `${customer.firstName} ${customer.lastName}`;
  const { price } = booking;
  const totalPrice = formatCents(price.totalCents);
  const petsListLabel = `${customerName}'s pets`;
  const baseCharge = formatCents(price.baseChargeCents);

  const petsText = pets.length === 1 ? '1 pet' : `${pets.length} pets`;
  const isCancelled = booking.status === 'cancelled';
  const timeRange = `${displayTime(booking.startTime)} – ${displayTime(booking.endTime)}`;
  const timeSummary = `${timeRange} · ${formatHours(booking.hoursRequested)} · ${petsText}`;

  return (
    <li aria-label={customerName} className="flex flex-col gap-xs">
      <div className="flex items-start justify-between gap-md">
        <div>
          <Typography className="font-medium">{customerName}</Typography>
          <div className="text-body-small text-on-surface-variant">{timeSummary}</div>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <Typography className="font-medium">{totalPrice}</Typography>
          {isCancelled && <Chip label="Cancelled" size="small" variant="outlined" />}
        </div>
      </div>

      <ul aria-label={petsListLabel} className="m-0 flex list-none flex-col p-0 pl-md">
        {pets.map((pet, index) => (
          <PetChargeRow key={pet.id} pet={pet} subtotalCents={price.pets[index]?.subtotalCents} />
        ))}
        <li className="flex justify-between gap-md text-body-small text-on-surface-variant">
          <span>Base charge</span>
          <span>{baseCharge}</span>
        </li>
      </ul>
    </li>
  );
}

function PetChargeRow({ pet, subtotalCents = 0 }: { pet: Pet; subtotalCents?: number }) {
  const animalLabel = `(${ANIMAL_TYPE_LABELS[pet.animalType]})`;
  const subtotal = formatCents(subtotalCents);

  return (
    <li className="flex justify-between gap-md text-body-small">
      <span>
        {pet.name} <span className="text-on-surface-variant">{animalLabel}</span>
      </span>
      <span>{subtotal}</span>
    </li>
  );
}
