import {
  dayEarningsCents,
  useDaySchedule,
  type StartTimeGroup,
} from '@pet-sitting/shared/booking-schedule';
import { DATE_FORMAT, displayTime, formatHours } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { ANIMAL_TYPE_LABELS } from '@pet-sitting/shared/domain';
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
  /** 'YYYY-MM-DD'. Kept by the app, so the booking screen can open a given day here. */
  date: string;
  onDateChange: (date: string) => void;
}

/** Admin, matching the web page: one day's bookings grouped by start time, and its earnings. */
export function MobileAdminScreen({ date, onDateChange }: MobileAdminScreenProps) {
  const { schedule, reload } = useDaySchedule(date);

  const shiftDay = (days: number) =>
    onDateChange(format(addDays(parse(date, DATE_FORMAT, new Date()), days), DATE_FORMAT));

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="headlineMedium" accessibilityRole="header">
            Bookings
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {format(parse(date, DATE_FORMAT, new Date()), 'EEEE, MMMM d, yyyy')}
          </Text>
        </View>
        {/* The day's earnings, lined up with the title. Cancelled bookings aren't counted. */}
        <View style={styles.earnings} accessibilityLiveRegion="polite">
          <Text variant="headlineMedium" testID="day-earnings">
            {schedule.status === 'loaded' ? formatCents(dayEarningsCents(schedule.groups)) : '…'}
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
          onPress={() => shiftDay(-1)}
        />
        <View style={styles.dayField}>
          <MobileDatePicker
            label="Day"
            value={date}
            onChange={(next) => next && onDateChange(next)}
          />
        </View>
        <IconButton
          icon="chevron-right"
          accessibilityLabel="Next day"
          onPress={() => shiftDay(1)}
        />
      </View>

      {schedule.status === 'loading' && (
        <ActivityIndicator accessibilityLabel="Loading bookings" style={styles.message} />
      )}

      {schedule.status === 'error' && (
        <View style={styles.message}>
          <Text style={styles.errorText}>{schedule.message}</Text>
          <Button onPress={reload}>Try again</Button>
        </View>
      )}

      {schedule.status === 'loaded' && schedule.groups.length === 0 && (
        <Text style={[styles.muted, styles.message]}>No bookings on this day.</Text>
      )}

      {schedule.status === 'loaded' &&
        schedule.groups.map((group) => <StartTimeCard key={group.startTime} group={group} />)}
    </ScrollView>
  );
}

/** One card per start time: "3 appointments starting at 7:00 AM", then each appointment. */
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

/** One appointment (one submission): the customer, the time, every pet with its charge, the total. */
function AppointmentItem({ item: { booking, customer, pets } }: { item: BookingListItem }) {
  const customerName = `${customer.firstName} ${customer.lastName}`;
  const { price } = booking;

  return (
    <View style={styles.appointment} accessibilityLabel={`Appointment for ${customerName}`}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text variant="bodyLarge" style={styles.bold}>
            {customerName}
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {displayTime(booking.startTime)} – {displayTime(booking.endTime)} ·{' '}
            {formatHours(booking.hoursRequested)} ·{' '}
            {pets.length === 1 ? '1 pet' : `${pets.length} pets`}
          </Text>
        </View>
        <View style={styles.amount}>
          <Text variant="bodyLarge" style={styles.bold}>
            {formatCents(price.totalCents)}
          </Text>
          {booking.status === 'cancelled' && (
            <Chip compact mode="outlined">
              Cancelled
            </Chip>
          )}
        </View>
      </View>

      <View style={styles.lines}>
        {pets.map((pet, index) => (
          <View key={pet.id} style={styles.row}>
            <Text variant="bodySmall">
              {pet.name}
              <Text style={styles.muted}> ({ANIMAL_TYPE_LABELS[pet.animalType]})</Text>
            </Text>
            <Text variant="bodySmall">{formatCents(price.pets[index]?.subtotalCents ?? 0)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text variant="bodySmall" style={styles.muted}>
            Base charge
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            {formatCents(price.baseChargeCents)}
          </Text>
        </View>
      </View>
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
