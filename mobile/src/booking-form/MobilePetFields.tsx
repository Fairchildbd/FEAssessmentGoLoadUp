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

type FormControl = Control<BookingFormValues, unknown, BookingRequest>;

interface MobilePetFieldsProps {
  control: FormControl;
  pets: ReturnType<typeof useBookingForm>['pets'];
}

export function MobilePetFields({ control, pets }: MobilePetFieldsProps) {
  const petValues = useWatch({ control, name: 'pets' });
  const canRemovePets = pets.fields.length > 1;
  const addPet = () => pets.append(emptyPet);

  return (
    <View style={styles.list}>
      {pets.fields.map((pet, index) => (
        <MobilePetRow
          key={pet.id}
          control={control}
          index={index}
          enteredName={petValues[index]?.name ?? ''}
          canRemove={canRemovePets}
          removePet={pets.remove}
        />
      ))}

      <Button mode="outlined" icon="plus" onPress={addPet} style={styles.add}>
        Add another pet
      </Button>
    </View>
  );
}

interface MobilePetRowProps {
  control: FormControl;
  index: number;
  enteredName: string;
  canRemove: boolean;
  removePet: (index: number) => void;
}

function MobilePetRow({ control, index, enteredName, canRemove, removePet }: MobilePetRowProps) {
  const petLabel = `Pet ${index + 1}`;
  const removeLabel = `Remove ${enteredName.trim() || petLabel}`;
  const removeThisPet = () => removePet(index);
  const animalTypeButtons = ANIMAL_TYPES.map((type) => ({
    value: type,
    label: ANIMAL_TYPE_LABELS[type],
    accessibilityLabel: `${petLabel} ${ANIMAL_TYPE_LABELS[type]}`,
  }));

  return (
    <View style={styles.pet} accessibilityLabel={petLabel}>
      <View style={styles.petHeader}>
        <Text variant="labelLarge">{petLabel}</Text>
        {canRemove && (
          <IconButton
            icon="delete-outline"
            accessibilityLabel={removeLabel}
            onPress={removeThisPet}
            style={styles.remove}
          />
        )}
      </View>

      <Controller
        name={`pets.${index}.name`}
        control={control}
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          return (
            <View>
              <TextInput
                mode="outlined"
                label="Pet's name"
                accessibilityLabel={`${petLabel} name`}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                autoCorrect={false}
                error={Boolean(errorMessage)}
              />
              {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}
            </View>
          );
        }}
      />

      <Controller
        name={`pets.${index}.animalType`}
        control={control}
        render={({ field, fieldState }) => {
          const errorMessage = fieldState.error?.message;
          const chooseAnimalType = (value: string) => {
            field.onChange(value as AnimalType);
            field.onBlur();
          };
          return (
            <View>
              <SegmentedButtons
                value={field.value ?? ''}
                theme={segmentTheme}
                onValueChange={chooseAnimalType}
                buttons={animalTypeButtons}
              />
              {errorMessage ? <HelperText type="error">{errorMessage}</HelperText> : null}
            </View>
          );
        }}
      />
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
