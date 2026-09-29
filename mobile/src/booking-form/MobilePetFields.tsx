import {
  emptyPet,
  type BookingFormValues,
  type BookingRequest,
  type useBookingForm,
} from '@pet-sitting/shared/booking-form';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { ANIMAL_TYPE_LABELS, ANIMAL_TYPES, type AnimalType } from '@pet-sitting/shared/domain';
import { Controller, useWatch, type Control } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  HelperText,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';

const { color, radius, spacing } = designTokens;

const segmentTheme = {
  colors: { secondaryContainer: color.primary, onSecondaryContainer: color.onPrimary },
};

interface MobilePetFieldsProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  pets: ReturnType<typeof useBookingForm>['pets'];
}

/**
 * One block per pet (name and animal type), plus a button to add another pet to the request. On a
 * phone the three animal types fit as segmented buttons, which take one tap instead of a menu.
 */
export function MobilePetFields({ control, pets }: MobilePetFieldsProps) {
  const petValues = useWatch({ control, name: 'pets' });
  const onlyOnePet = pets.fields.length === 1;

  return (
    <View style={styles.list}>
      {pets.fields.map((pet, index) => {
        const petName = petValues[index]?.name.trim() || `Pet ${index + 1}`;
        return (
          <View key={pet.id} style={styles.pet} accessibilityLabel={`Pet ${index + 1}`}>
            <View style={styles.petHeader}>
              <Text variant="labelLarge">Pet {index + 1}</Text>
              {!onlyOnePet && (
                <IconButton
                  icon="delete-outline"
                  accessibilityLabel={`Remove ${petName}`}
                  onPress={() => pets.remove(index)}
                  style={styles.remove}
                />
              )}
            </View>

            <Controller
              name={`pets.${index}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <View>
                  <TextInput
                    mode="outlined"
                    label="Pet's name"
                    accessibilityLabel={`Pet ${index + 1} name`}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    autoCorrect={false}
                    error={Boolean(fieldState.error)}
                  />
                  {fieldState.error ? (
                    <HelperText type="error">{fieldState.error.message}</HelperText>
                  ) : null}
                </View>
              )}
            />

            <Controller
              name={`pets.${index}.animalType`}
              control={control}
              render={({ field, fieldState }) => (
                <View>
                  <SegmentedButtons
                    value={field.value ?? ''}
                    // Paper fills the chosen segment with secondaryContainer (the lime accent);
                    // use the primary green instead, as everywhere else a choice is highlighted.
                    theme={segmentTheme}
                    onValueChange={(value) => {
                      field.onChange(value as AnimalType);
                      field.onBlur(); // a tap is a finished choice
                    }}
                    buttons={ANIMAL_TYPES.map((type) => ({
                      value: type,
                      label: ANIMAL_TYPE_LABELS[type],
                      accessibilityLabel: `Pet ${index + 1} ${ANIMAL_TYPE_LABELS[type]}`,
                    }))}
                  />
                  {fieldState.error ? (
                    <HelperText type="error">{fieldState.error.message}</HelperText>
                  ) : null}
                </View>
              )}
            />
          </View>
        );
      })}

      <Button mode="outlined" icon="plus" onPress={() => pets.append(emptyPet)} style={styles.add}>
        Add another pet
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  pet: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.outlineVariant,
  },
  petHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remove: { margin: -spacing.sm },
  add: { alignSelf: 'flex-start' },
});
