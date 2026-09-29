import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfToday } from 'date-fns/startOfToday';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { Calendar, en, registerTranslation } from 'react-native-paper-dates';
import { MobileFullScreenModal } from './MobileFullScreenModal';

// The calendar's month and weekday names. Registered once, when this module first loads.
registerTranslation('en', en);

export interface MobileDatePickerProps {
  label: string;
  /** 'YYYY-MM-DD', or '' for no date. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the calendar closes, which counts as leaving the field. */
  onClose?: () => void;
  disablePast?: boolean;
  error?: string;
}

/**
 * The mobile counterpart of WebDatePicker: a field that can't be typed in, and tapping anywhere on
 * it (the text or the calendar icon) opens a full-screen calendar. It takes and returns 'YYYY-MM-DD'
 * strings.
 *
 * The calendar is react-native-paper-dates' Calendar in our own full-screen modal, rather than its
 * DatePickerModal, whose "Select date" header (with a pencil to type the date instead) can't be
 * turned off. The time picker uses the same modal.
 */
export function MobileDatePicker({
  label,
  value,
  onChange,
  onClose,
  disablePast,
  error,
}: MobileDatePickerProps) {
  const [open, setOpen] = useState(false);
  const date = value ? parse(value, DATE_FORMAT, new Date()) : undefined;
  // The day tapped in the calendar, kept until Save.
  const [draft, setDraft] = useState<Date | undefined>(date);
  const shown = date ? format(date, 'MM/dd/yyyy') : '';

  const close = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <View>
      <Pressable
        onPress={() => {
          setDraft(date); // start from the saved date each time
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={`${label}${shown ? `, ${shown}` : ''}`}
        accessibilityHint="Opens a calendar"
      >
        {/* pointerEvents="none" lets the whole field act as one button and stops the keyboard. */}
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={shown}
            placeholder="MM/DD/YYYY"
            editable={false}
            error={Boolean(error)}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>
      </Pressable>
      {error ? <HelperText type="error">{error}</HelperText> : null}

      <MobileFullScreenModal
        visible={open}
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        onDismiss={close}
        onSave={() => {
          if (draft) onChange(format(draft, DATE_FORMAT));
          close();
        }}
        saveDisabled={!draft}
      >
        <Calendar
          locale="en"
          mode="single"
          date={draft}
          onChange={({ date: picked }) => setDraft(picked)}
          validRange={disablePast ? { startDate: startOfToday() } : undefined}
        />
      </MobileFullScreenModal>
    </View>
  );
}
