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
import { DATE_FORMAT, displayTime, matchesFormat } from '@pet-sitting/shared/date-time';
import { ANIMAL_TYPE_LABELS } from '@pet-sitting/shared/domain';
import { formatCents } from '@pet-sitting/shared/pricing';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { Fragment } from 'react';
import { useSearchParams } from 'react-router';
import { WebDatePicker } from '../components/WebDatePicker';

const pluralHours = (hours: number) => `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

/**
 * The day's date is in the URL (/admin?date=2026-10-03), so a day can be linked to and the browser's
 * back button steps through the days viewed. Without one, the page shows today.
 */
function useSelectedDate(): [string, (date: string) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromUrl = searchParams.get('date') ?? '';
  const date = matchesFormat(fromUrl, DATE_FORMAT) ? fromUrl : format(new Date(), DATE_FORMAT);
  const setDate = (next: string) => setSearchParams({ date: next });
  return [date, setDate];
}

/** Admin: one day's bookings, grouped by start time, earliest first. */
export function WebAdminPage() {
  const [date, setDate] = useSelectedDate();
  const { schedule, reload } = useDaySchedule(date);

  const shiftDay = (days: number) =>
    setDate(format(addDays(parse(date, DATE_FORMAT, new Date()), days), DATE_FORMAT));

  return (
    <Container component="main" maxWidth="sm" className="py-xl">
      <div className="flex items-start justify-between gap-md">
        <div>
          <Typography variant="h4" component="h1">
            Bookings
          </Typography>
          <Typography color="text.secondary" className="mt-xs">
            {format(parse(date, DATE_FORMAT, new Date()), 'EEEE, MMMM d, yyyy')}
          </Typography>
        </div>
        {/* The day's earnings, lined up with the title. Cancelled bookings aren't counted. */}
        <div className="text-right" aria-live="polite">
          <Typography variant="h4" component="p" data-testid="day-earnings">
            {schedule.status === 'loaded' ? formatCents(dayEarningsCents(schedule.groups)) : '…'}
          </Typography>
          <Typography color="text.secondary" className="mt-xs">
            Total earnings
          </Typography>
        </div>
      </div>

      <div className="mt-lg flex items-center gap-sm">
        <IconButton aria-label="Previous day" onClick={() => shiftDay(-1)}>
          <ChevronLeftIcon />
        </IconButton>
        <div className="flex-1">
          <WebDatePicker label="Day" value={date} onChange={(next) => next && setDate(next)} />
        </div>
        <IconButton aria-label="Next day" onClick={() => shiftDay(1)}>
          <ChevronRightIcon />
        </IconButton>
      </div>

      <section aria-label="Schedule" aria-busy={schedule.status === 'loading'} className="mt-lg">
        {schedule.status === 'loading' && (
          <div className="flex justify-center py-xl">
            <CircularProgress aria-label="Loading bookings" />
          </div>
        )}

        {schedule.status === 'error' && (
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

        {schedule.status === 'loaded' && schedule.groups.length === 0 && (
          <Typography color="text.secondary" className="py-xl text-center">
            No bookings on this day.
          </Typography>
        )}

        {schedule.status === 'loaded' && (
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

/** One card per start time: "3 appointments starting at 7:00 AM", then each appointment. */
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

/**
 * One appointment (one submission): the customer, the time, and every pet in it with its charge,
 * then the base charge once and the total.
 */
function AppointmentItem({ item: { booking, customer, pets } }: { item: BookingListItem }) {
  const customerName = `${customer.firstName} ${customer.lastName}`;
  const { price } = booking;

  return (
    <li aria-label={customerName} className="flex flex-col gap-xs">
      <div className="flex items-start justify-between gap-md">
        <div>
          <Typography className="font-medium">{customerName}</Typography>
          <div className="text-body-small text-on-surface-variant">
            {displayTime(booking.startTime)} – {displayTime(booking.endTime)} ·{' '}
            {pluralHours(booking.hoursRequested)} ·{' '}
            {pets.length === 1 ? '1 pet' : `${pets.length} pets`}
          </div>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <Typography className="font-medium">{formatCents(price.totalCents)}</Typography>
          {booking.status === 'cancelled' && (
            <Chip label="Cancelled" size="small" variant="outlined" />
          )}
        </div>
      </div>

      <ul aria-label={`${customerName}'s pets`} className="m-0 flex list-none flex-col p-0 pl-md">
        {pets.map((pet, index) => (
          <li key={pet.id} className="flex justify-between gap-md text-body-small">
            <span>
              {pet.name}
              <span className="text-on-surface-variant">
                {' '}
                ({ANIMAL_TYPE_LABELS[pet.animalType]})
              </span>
            </span>
            <span>{formatCents(price.pets[index]?.subtotalCents ?? 0)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-md text-body-small text-on-surface-variant">
          <span>Base charge</span>
          <span>{formatCents(price.baseChargeCents)}</span>
        </li>
      </ul>
    </li>
  );
}
