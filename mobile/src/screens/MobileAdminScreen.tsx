import {
  dayEarningsCents,
  useDaySchedule,
  type StartTimeGroup,
} from '@pet-sitting/shared/booking-schedule';
import { DATE_FORMAT, displayTime, formatHours } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { ANIMAL_TYPE_LABELS, type Pet } from '@pet-sitting/shared/domain';
import type { BookingListItem } from '@pet-sitting/shared/mock-api';
import { formatCents } from '@pet-sitting/shared/pricing';
import { addDays } from 'date-fns/addDays';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  Text,
} from 'react-native-paper';
import { MobileDatePicker } from '../components/MobileDatePicker';

const { color, spacing } = designTokens;

interface MobileAdminScreenProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function MobileAdminScreen({ date, onDateChange }: MobileAdminScreenProps) {
  const { schedule, reload } = useDaySchedule(date);

  const selectedDay = parse(date, DATE_FORMAT, new Date());
  const shiftDay = (days: number) => onDateChange(format(addDays(selectedDay, days), DATE_FORMAT));
  const showPreviousDay = () => shiftDay(-1);
  const showNextDay = () => shiftDay(1);
  const pickDay = (next: string) => next && onDateChange(next);
  const dayHeading = format(selectedDay, 'EEEE, MMMM d, yyyy');

  const isLoading = schedule.status === 'loading';
  const isError = schedule.status === 'error';
  const isLoaded = schedule.status === 'loaded';
  const formattedEarnings = isLoaded ? formatCents(dayEarningsCents(schedule.groups)) : '…';
  const hasNoBookings = isLoaded && schedule.groups.length === 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="headlineMedium" accessibilityRole="header">
            Bookings
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {dayHeading}
          </Text>
        </View>
        <View style={styles.earnings} accessibilityLiveRegion="polite">
          <Text variant="headlineMedium" testID="day-earnings">
            {formattedEarnings}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            Total earnings
          </Text>
        </View>
      </View>

      <View style={styles.dayPicker}>
        <IconButton
          icon="chevron-left"
          accessibilityLabel="Previous day"
          onPress={showPreviousDay}
        />
        <View style={styles.dayField}>
          <MobileDatePicker label="Day" value={date} onChange={pickDay} />
        </View>
        <IconButton icon="chevron-right" accessibilityLabel="Next day" onPress={showNextDay} />
      </View>

      {isLoading && (
        <ActivityIndicator accessibilityLabel="Loading bookings" style={styles.message} />
      )}

      {isError && (
        <View style={styles.message}>
          <Text style={styles.errorText}>{schedule.message}</Text>
          <Button onPress={reload}>Try again</Button>
        </View>
      )}

      {hasNoBookings && (
        <Text style={[styles.muted, styles.message]}>No bookings on this day.</Text>
      )}

      {isLoaded &&
        schedule.groups.map((group) => <StartTimeCard key={group.startTime} group={group} />)}
    </ScrollView>
  );
}

function StartTimeCard({ group }: { group: StartTimeGroup }) {
  const count = group.items.length;
  const title = `${count} ${count === 1 ? 'appointment' : 'appointments'} starting at ${displayTime(group.startTime)}`;

  return (
    <Card mode="outlined" accessibilityLabel={title}>
      <Card.Content style={styles.card}>
        <Text variant="titleMedium" accessibilityRole="header">
          {title}
        </Text>
        {group.items.map((item, index) => (
          <Fragment key={item.booking.id}>
            {index > 0 && <Divider />}
            <AppointmentItem item={item} />
          </Fragment>
        ))}
      </Card.Content>
    </Card>
  );
}

function AppointmentItem({ item: { booking, customer, pets } }: { item: BookingListItem }) {
  const customerName = `${customer.firstName} ${customer.lastName}`;
  const { price } = booking;
  const appointmentLabel = `Appointment for ${customerName}`;
  const petsText = pets.length === 1 ? '1 pet' : `${pets.length} pets`;
  const timeRange = `${displayTime(booking.startTime)} – ${displayTime(booking.endTime)}`;
  const timeSummary = `${timeRange} · ${formatHours(booking.hoursRequested)} · ${petsText}`;
  const totalPrice = formatCents(price.totalCents);
  const baseCharge = formatCents(price.baseChargeCents);
  const isCancelled = booking.status === 'cancelled';

  return (
    <View style={styles.appointment} accessibilityLabel={appointmentLabel}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text variant="bodyLarge" style={styles.bold}>
            {customerName}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {timeSummary}
          </Text>
        </View>
        <View style={styles.amount}>
          <Text variant="bodyLarge" style={styles.bold}>
            {totalPrice}
          </Text>
          {isCancelled && (
            <Chip compact mode="outlined">
              Cancelled
            </Chip>
          )}
        </View>
      </View>

      <View style={styles.lines}>
        {pets.map((pet, index) => (
          <PetChargeRow key={pet.id} pet={pet} subtotalCents={price.pets[index]?.subtotalCents} />
        ))}
        <View style={styles.row}>
          <Text variant="bodySmall" style={styles.muted}>
            Base charge
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {baseCharge}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PetChargeRow({ pet, subtotalCents = 0 }: { pet: Pet; subtotalCents?: number }) {
  const animalLabel = ` (${ANIMAL_TYPE_LABELS[pet.animalType]})`;
  const subtotal = formatCents(subtotalCents);

  return (
    <View style={styles.row}>
      <Text variant="bodySmall">
        {pet.name}
        <Text style={styles.muted}>{animalLabel}</Text>
      </Text>
      <Text variant="bodySmall">{subtotal}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  headerText: { flexShrink: 1 },
  earnings: { alignItems: 'flex-end' },
  muted: { color: color.onSurfaceVariant },
  dayPicker: { flexDirection: 'row', alignItems: 'center' },
  dayField: { flex: 1 },
  message: { paddingVertical: spacing.xl, alignItems: 'center', textAlign: 'center' },
  errorText: { color: color.error },
  card: { gap: spacing.sm },
  appointment: { gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  grow: { flexShrink: 1 },
  amount: { alignItems: 'flex-end', gap: spacing.xs },
  bold: { fontWeight: '500' },
  lines: { paddingLeft: spacing.md, gap: spacing.xxs },
});
