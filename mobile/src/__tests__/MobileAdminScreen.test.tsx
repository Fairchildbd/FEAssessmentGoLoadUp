import { fireEvent, screen, within } from '@testing-library/react-native';
import {
  fillName,
  fillPet,
  pickDate,
  pickTime,
  renderApp,
  submitButton,
} from '../test-utils/mobileTestHelpers';

// The same behaviors as web/e2e/webAdminPage.spec.ts, on the phone. The seed has bookings on
// 3, 5 and 10 October 2026, and "now" is noon on 1 October.

beforeEach(renderApp);

// Paper gives tab bar items the "button" role on iOS (the test platform) and "tab" on Android.
const tab = (name: string) => screen.getByRole('button', { name });
const openAdminTab = () => fireEvent.press(tab('Admin'));

/** The start-time cards' titles, top to bottom. */
const cardTitles = () =>
  screen
    .getAllByRole('header')
    .map((header) => header.props.children)
    .filter((text): text is string => typeof text === 'string' && text.includes('starting at'));

const earnings = () => screen.getByTestId('day-earnings');

async function showDay(day: number) {
  await pickDate(day, 'Day');
  await screen.findByLabelText(new RegExp(`^Day, 10/${String(day).padStart(2, '0')}/2026`));
}

test('groups a day’s bookings by start time, earliest first, with the day’s earnings', async () => {
  await openAdminTab();
  await showDay(3);

  expect(await screen.findByText('2 appointments starting at 9:00 AM')).toBeOnTheScreen();
  expect(cardTitles()).toEqual([
    '2 appointments starting at 9:00 AM',
    '1 appointment starting at 11:00 AM',
  ]);
  expect(earnings()).toHaveTextContent('$120');

  // Jordan booked each dog separately, so they're two appointments.
  const nineOClock = screen.getByLabelText('2 appointments starting at 9:00 AM');
  const appointments = within(nineOClock).getAllByLabelText('Appointment for Jordan Rivera');
  expect(appointments).toHaveLength(2);
  expect(appointments[0]).toHaveTextContent(/9:00 AM – 11:00 AM · 2 hours · 1 pet/);
  expect(appointments[0]).toHaveTextContent(/Biscuit \(Dog\)/);
  expect(appointments[1]).toHaveTextContent(/Maple \(Dog\)/);
});

test('switches days with the date picker and the previous and next buttons', async () => {
  await openAdminTab();
  expect(screen.getByText('Thursday, October 1, 2026')).toBeOnTheScreen(); // today
  expect(await screen.findByText('No bookings on this day.')).toBeOnTheScreen();
  expect(earnings()).toHaveTextContent('$0');

  await showDay(5);
  expect(await screen.findByText('1 appointment starting at 10:00 AM')).toBeOnTheScreen();
  expect(cardTitles()).toEqual([
    '1 appointment starting at 9:00 AM',
    '1 appointment starting at 10:00 AM',
  ]);

  await fireEvent.press(screen.getByLabelText('Next day'));
  expect(screen.getByText('Tuesday, October 6, 2026')).toBeOnTheScreen();
  expect(await screen.findByText('No bookings on this day.')).toBeOnTheScreen();

  await showDay(11);
  await fireEvent.press(screen.getByLabelText('Previous day'));
  expect(await screen.findByText('1 appointment starting at 12:00 PM')).toBeOnTheScreen();
  expect(cardTitles()).toEqual([
    '1 appointment starting at 8:00 AM',
    '1 appointment starting at 10:00 AM',
    '1 appointment starting at 12:00 PM',
  ]);
  expect(screen.getByText('Cancelled')).toBeOnTheScreen(); // Hamlet's 10:00 booking
  expect(earnings()).toHaveTextContent('$180'); // the cancelled $140 earns nothing
});

test('one submission is one appointment, with all its pets under the customer', async () => {
  await fillName('Ben', 'Fairchild');
  const pets = [
    ['Oscar', 'Dog'],
    ['Sulley', 'Dog'],
    ['Mittens', 'Cat'],
    ['Babe', 'Pig'],
  ] as const;
  for (const [index, [name, type]] of pets.entries()) {
    if (index > 0) await fireEvent.press(screen.getByText('Add another pet'));
    await fillPet(index, name, type);
  }
  await pickDate(3);
  await pickTime('8:30 AM', '4:30 PM');
  await fireEvent.press(submitButton());

  expect(await screen.findByText('Booked Oscar, Sulley, Mittens, and Babe.')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText("See the day's bookings"));

  expect(await screen.findByText('1 appointment starting at 8:30 AM')).toBeOnTheScreen();
  expect(screen.getByLabelText('Day, 10/03/2026')).toBeOnTheScreen();
  expect(cardTitles()).toEqual([
    '1 appointment starting at 8:30 AM',
    '2 appointments starting at 9:00 AM',
    '1 appointment starting at 11:00 AM',
  ]);
  const appointment = screen.getByLabelText('Appointment for Ben Fairchild');
  expect(appointment).toHaveTextContent(/8:30 AM – 4:30 PM · 8 hours · 4 pets/);
  // 8 hours each, and the $20 base once: $80 + $80 + $40 + $160 + $20 = $380.
  for (const line of [
    /Oscar \(Dog\)\$80/,
    /Sulley \(Dog\)\$80/,
    /Mittens \(Cat\)\$40/,
    /Babe \(Pig\)\$160/,
    /Base charge\$20/,
  ]) {
    expect(appointment).toHaveTextContent(line);
  }
  expect(appointment).toHaveTextContent(/\$380/);
  expect(earnings()).toHaveTextContent('$500'); // $120 from the seed + $380

  // The tabs switch back to the form, and the booking is still there on return.
  await fireEvent.press(tab('Book a sitter'));
  await openAdminTab();
  expect(await screen.findByText('1 appointment starting at 8:30 AM')).toBeOnTheScreen();
});

test("refuses a booking that overlaps one of the pet's bookings", async () => {
  // Biscuit is booked from 9:00 to 11:00 and from 11:00 to 1:00 on 3 October.
  await fillName('Jordan', 'Rivera');
  await fillPet(0, 'Biscuit', 'Dog');
  await pickDate(3);
  await pickTime('10:00 AM', '12:00 PM');
  await fireEvent.press(submitButton());

  expect(
    await screen.findByText('Biscuit already has a booking from 9:00 AM to 11:00 AM that day'),
  ).toBeOnTheScreen();
  expect(screen.getByLabelText('Pet 1 name')).toHaveDisplayValue('Biscuit'); // kept
});
