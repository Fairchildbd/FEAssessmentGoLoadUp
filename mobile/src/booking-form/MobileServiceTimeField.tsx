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
        const fieldText = hasRange ? `${displayTime(startTime)} – ${displayTime(endTime)}` : '';
        const fieldLabel = hasRange ? `Time, ${fieldText}` : 'Time';
        const errorMessage = fieldState.error?.message;
        const rangeLength = hasRange ? formatHours(hoursBetween(startTime, endTime)) : '';
        const helperType = errorMessage ? 'error' : 'info';
        const showHelper = Boolean(errorMessage) || hasRange;
        const canSave = draft.startTime !== '' && draft.endTime !== '';

        const openPicker = () => {
          setDraft(field.value);
          setOpen(true);
        };
        const close = () => {
          setOpen(false);
          field.onBlur();
        };
        const saveDraft = () => {
          field.onChange(draft);
          close();
        };

        return (
          <View>
            <Pressable
              onPress={openPicker}
              accessibilityRole="button"
              accessibilityLabel={fieldLabel}
              accessibilityHint="Opens a list of start and end times"
            >
              <View pointerEvents="none">
                <TextInput
                  mode="outlined"
                  label="Time"
                  value={fieldText}
                  placeholder="Start – end"
                  editable={false}
                  error={Boolean(errorMessage)}
                  right={<TextInput.Icon icon="clock-outline" />}
                />
              </View>
            </Pressable>
            <HelperText type={helperType} visible={showHelper}>
              {errorMessage ?? rangeLength}
            </HelperText>

            <MobileFullScreenModal
              visible={open}
              accessibilityLabel="Choose a start and end time"
              onDismiss={close}
              onSave={saveDraft}
              saveDisabled={!canSave}
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

function TimeColumns({ draft, onChange, serviceDate }: TimeColumnsProps) {
  const { startTime, endTime } = draft;
  const hasStart = startTime !== '';
  const pickStart = (time: string) =>
    onChange({ startTime: time, endTime: endTimeForNewStart(draft, time) });
  const pickEnd = (time: string) => onChange({ startTime, endTime: time });
  const startOptions = START_TIMES.map((time) => ({
    time,
    label: displayTime(time),
    selected: time === startTime,
    passed: hasStartPassed(serviceDate, time),
  }));
  const endOptions = endTimeOptions(startTime).map((time) => ({
    time,
    label: displayTime(time),
    length: formatHours(hoursBetween(startTime, time)),
    selected: time === endTime,
  }));

  return (
    <View style={styles.picker}>
      <View style={styles.columns}>
        <ScrollView style={styles.column} accessibilityLabel="Start time">
          <List.Subheader>Start</List.Subheader>
          {startOptions.map((option) => (
            <List.Item
              key={option.time}
              title={option.label}
              accessibilityLabel={`Start ${option.label}`}
              accessibilityState={{ selected: option.selected, disabled: option.passed }}
              disabled={option.passed}
              onPress={() => pickStart(option.time)}
              style={option.selected ? styles.selected : undefined}
              titleStyle={option.passed ? styles.disabled : undefined}
            />
          ))}
        </ScrollView>

        <ScrollView style={[styles.column, styles.endColumn]} accessibilityLabel="End time">
          <List.Subheader>End</List.Subheader>
          {hasStart ? (
            endOptions.map((option) => (
              <List.Item
                key={option.time}
                title={option.label}
                description={option.length}
                accessibilityLabel={`End ${option.label}, ${option.length}`}
                accessibilityState={{ selected: option.selected }}
                onPress={() => pickEnd(option.time)}
                style={option.selected ? styles.selected : undefined}
              />
            ))
          ) : (
            <Text variant="bodyMedium" style={[styles.muted, styles.hint]}>
              Choose a start time first
            </Text>
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
