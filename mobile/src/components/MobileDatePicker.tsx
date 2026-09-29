import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { startOfToday } from 'date-fns/startOfToday';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { Calendar, en, registerTranslation } from 'react-native-paper-dates';
import { MobileFullScreenModal } from './MobileFullScreenModal';

registerTranslation('en', en);

export interface MobileDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  disablePast?: boolean;
  error?: string;
}

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
  const [draft, setDraft] = useState<Date | undefined>(date);
  const fieldText = date ? format(date, 'MM/dd/yyyy') : '';
  const fieldLabel = fieldText ? `${label}, ${fieldText}` : label;
  const modalLabel = `Choose ${label.toLowerCase()}`;
  const validRange = disablePast ? { startDate: startOfToday() } : undefined;

  const openCalendar = () => {
    setDraft(date);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    onClose?.();
  };
  const saveDraft = () => {
    if (draft) onChange(format(draft, DATE_FORMAT));
    close();
  };
  const pickDraft = ({ date: picked }: { date: Date | undefined }) => setDraft(picked);

  return (
    <View>
      <Pressable
        onPress={openCalendar}
        accessibilityRole="button"
        accessibilityLabel={fieldLabel}
        accessibilityHint="Opens a calendar"
      >
        <View pointerEvents="none">
          <TextInput
            mode="outlined"
            label={label}
            value={fieldText}
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
        accessibilityLabel={modalLabel}
        onDismiss={close}
        onSave={saveDraft}
        saveDisabled={!draft}
      >
        <Calendar
          locale="en"
          mode="single"
          date={draft}
          onChange={pickDraft}
          validRange={validRange}
        />
      </MobileFullScreenModal>
    </View>
  );
}
