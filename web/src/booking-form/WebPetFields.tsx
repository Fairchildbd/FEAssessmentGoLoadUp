import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import {
  emptyPet,
  type BookingFormValues,
  type BookingRequest,
  type useBookingForm,
} from '@pet-sitting/shared/booking-form';
import { ANIMAL_TYPE_LABELS, ANIMAL_TYPES, type AnimalType } from '@pet-sitting/shared/domain';
import type { ChangeEvent } from 'react';
import { Controller, useWatch, type Control } from 'react-hook-form';

type FormControl = Control<BookingFormValues, unknown, BookingRequest>;

interface WebPetFieldsProps {
  control: FormControl;
  pets: ReturnType<typeof useBookingForm>['pets'];
}

export function WebPetFields({ control, pets }: WebPetFieldsProps) {
  const petValues = useWatch({ control, name: 'pets' });
  const canRemovePets = pets.fields.length > 1;
  const addPet = () => pets.append(emptyPet);

  return (
    <div className="flex flex-col gap-md">
      {pets.fields.map((pet, index) => (
        <WebPetRow
          key={pet.id}
          control={control}
          index={index}
          enteredName={petValues[index]?.name ?? ''}
          canRemove={canRemovePets}
          removePet={pets.remove}
        />
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addPet}
        className="self-start rounded-pill"
      >
        Add another pet
      </Button>
    </div>
  );
}

interface WebPetRowProps {
  control: FormControl;
  index: number;
  enteredName: string;
  canRemove: boolean;
  removePet: (index: number) => void;
}

function WebPetRow({ control, index, enteredName, canRemove, removePet }: WebPetRowProps) {
  const petLabel = `Pet ${index + 1}`;
  const removeLabel = `Remove ${enteredName.trim() || petLabel}`;
  const removeThisPet = () => removePet(index);

  return (
    <div role="group" aria-label={petLabel} className="flex items-start gap-sm">
      <div className="grid flex-1 gap-md sm:grid-cols-2">
        <Controller
          name={`pets.${index}.name`}
          control={control}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message;
            return (
              <TextField
                {...field}
                inputRef={field.ref}
                label="Pet's name"
                autoComplete="off"
                error={Boolean(errorMessage)}
                helperText={errorMessage}
              />
            );
          }}
        />
        <Controller
          name={`pets.${index}.animalType`}
          control={control}
          render={({ field, fieldState }) => {
            const errorMessage = fieldState.error?.message;
            const chooseAnimalType = (event: ChangeEvent<HTMLInputElement>) =>
              field.onChange(event.target.value as AnimalType);
            return (
              <TextField
                select
                name={field.name}
                inputRef={field.ref}
                label="Animal type"
                value={field.value ?? ''}
                onChange={chooseAnimalType}
                onBlur={field.onBlur}
                error={Boolean(errorMessage)}
                helperText={errorMessage}
              >
                {ANIMAL_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {ANIMAL_TYPE_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>
            );
          }}
        />
      </div>
      {canRemove && (
        <IconButton aria-label={removeLabel} onClick={removeThisPet} className="mt-sm">
          <DeleteOutlinedIcon />
        </IconButton>
      )}
    </div>
  );
}
