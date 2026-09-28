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
import { Controller, useWatch, type Control } from 'react-hook-form';

interface WebPetFieldsProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
  pets: ReturnType<typeof useBookingForm>['pets'];
}

/** One row per pet (name and animal type), plus a button to add another pet to the request. */
export function WebPetFields({ control, pets }: WebPetFieldsProps) {
  const petValues = useWatch({ control, name: 'pets' });
  const onlyOnePet = pets.fields.length === 1;

  return (
    <div className="flex flex-col gap-md">
      {pets.fields.map((pet, index) => {
        const petName = petValues[index]?.name.trim() || `Pet ${index + 1}`;
        return (
          <div
            key={pet.id}
            role="group"
            aria-label={`Pet ${index + 1}`}
            className="flex items-start gap-sm"
          >
            <div className="grid flex-1 gap-md sm:grid-cols-2">
              <Controller
                name={`pets.${index}.name`}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    inputRef={field.ref}
                    label="Pet's name"
                    autoComplete="off"
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name={`pets.${index}.animalType`}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    select
                    name={field.name}
                    inputRef={field.ref}
                    label="Animal type"
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value as AnimalType)}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    helperText={fieldState.error?.message}
                  >
                    {ANIMAL_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {ANIMAL_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </div>
            {!onlyOnePet && (
              <IconButton
                aria-label={`Remove ${petName}`}
                onClick={() => pets.remove(index)}
                className="mt-sm"
              >
                <DeleteOutlinedIcon />
              </IconButton>
            )}
          </div>
        );
      })}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => pets.append(emptyPet)}
        className="self-start rounded-pill"
      >
        Add another pet
      </Button>
    </div>
  );
}
