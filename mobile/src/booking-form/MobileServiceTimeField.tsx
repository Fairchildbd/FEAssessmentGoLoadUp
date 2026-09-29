import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import { displayTime, formatHours, hoursBetween } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import {
  endTimeForNewStart,
  endTimeOptions,
  hasStartPassed,
  startTimeOptions,
} from '@pet-sitting/shared/service-time';
import { useState } from 'react';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { HelperText, List, Text, TextInput } from 'react-native-paper';
import { MobileFullScreenModal } from '../components/MobileFullScreenModal';

const { color, spacing } = designTokens;

const START_TIMES = startTimeOptions();

type ServiceTime = BookingFormValues['serviceTime'];

interface MobileServiceTimeFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

/**
 * The start and end time in one input, like the web field. Tapping it opens a full-screen picker,
 * the same as the calendar's, with a Start column and an End column; the End column only lists
 * times 2 to 8 hours after the start, so a length outside the limits can't be picked. The lists
 * come from shared/. Picks are a draft until Save.
 */
export function MobileServiceTimeField({ control }: MobileServiceTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ServiceTime>({ startTime: '', endTime: '' });
  const serviceDate = useWatch({ control, name: 'serviceDate' });

  return (
    <Controller
      name="serviceTime"
      control={control}
      render={({ field, fieldState }) => {
        const { startTime, endTime } = field.value;
        const hasRange = startTime !== '' && endTime !== '';
        const shown = hasRange ? `${displayTime(startTime)} – ${displayTime(endTime)}` : '';

        const close = () => {
          setOpen(false);
          field.onBlur(); // counts as leaving the field, so its error can show
        };

        return (
          <View>
            <Pressable
              onPress={() => {
                setDraft(field.value); // start from the saved times each time
                setOpen(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Time${shown ? `, ${shown}` : ''}`}
              accessibilityHint="Opens a list of start and end times"
            >
              {/* pointerEvents="none" lets the whole field act as one button and stops the keyboard. */}
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  label="Time"
                  value={shown}
                  placeholder="Start – end"
                  editable={false}
                  error={Boolean(fieldState.error)}
                  right={<TextInput.Icon icon="clock-outline" />}
                />
              </View>
            </Pressable>
            <HelperText
              type={fieldState.error ? 'error' : 'info'}
              visible={Boolean(fieldState.error) || hasRange}
            >
              {fieldState.error?.message ??
                (hasRange ? formatHours(hoursBetween(startTime, endTime)) : '')}
            </HelperText>

            <MobileFullScreenModal
              visible={open}
              accessibilityLabel="Choose a start and end time"
              onDismiss={close}
              onSave={() => {
                field.onChange(draft);
                close();
              }}
              saveDisabled={draft.startTime === '' || draft.endTime === ''}
            >
              <TimeColumns draft={draft} onChange={setDraft} serviceDate={serviceDate} />
            </MobileFullScreenModal>
          </View>
        );
      }}
    />
  );
}

interface TimeColumnsProps {
  draft: ServiceTime;
  onChange: (draft: ServiceTime) => void;
  serviceDate: string;
}

/** The Start and End columns, side by side and scrolling separately. */
function TimeColumns({ draft, onChange, serviceDate }: TimeColumnsProps) {
  const { startTime, endTime } = draft;

  return (
    <View style={styles.picker}>
      <View style={styles.columns}>
        <ScrollView style={styles.column} accessibilityLabel="Start time">
          <List.Subheader>Start</List.Subheader>
          {START_TIMES.map((time) => {
            const passed = hasStartPassed(serviceDate, time); // on today's date
            return (
              <List.Item
                key={time}
                title={displayTime(time)}
                accessibilityLabel={`Start ${displayTime(time)}`}
                accessibilityState={{ selected: time === startTime, disabled: passed }}
                disabled={passed}
                onPress={() =>
                  onChange({ startTime: time, endTime: endTimeForNewStart(draft, time) })
                }
                style={time === startTime ? styles.selected : undefined}
                titleStyle={passed ? styles.disabled : undefined}
              />
            );
          })}
        </ScrollView>

        <ScrollView style={[styles.column, styles.endColumn]} accessibilityLabel="End time">
          <List.Subheader>End</List.Subheader>
          {startTime === '' ? (
            <Text variant="bodyMedium" style={[styles.muted, styles.hint]}>
              Choose a start time first
            </Text>
          ) : (
            endTimeOptions(startTime).map((time) => {
              const hours = formatHours(hoursBetween(startTime, time));
              return (
                <List.Item
                  key={time}
                  title={displayTime(time)}
                  description={hours}
                  accessibilityLabel={`End ${displayTime(time)}, ${hours}`}
                  accessibilityState={{ selected: time === endTime }}
                  onPress={() => onChange({ startTime, endTime: time })}
                  style={time === endTime ? styles.selected : undefined}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { flex: 1 },
  columns: { flex: 1, flexDirection: 'row' },
  column: { flex: 1 },
  endColumn: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: color.outlineVariant,
  },
  selected: { backgroundColor: color.primaryContainer },
  disabled: { color: color.outline },
  muted: { color: color.onSurfaceVariant },
  hint: { paddingHorizontal: spacing.md },
});
