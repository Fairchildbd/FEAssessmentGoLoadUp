import { fireEvent, screen, within } from '@testing-library/react-native';
import {
  fillName,
  fillPet,
  pickDate,
  pickTime,
  renderApp,
  submitButton,
} from '../test-utils/mobileTestHelpers';

// The same behaviors as web/e2e/webBookingPage.spec.ts, on the phone.

beforeEach(renderApp);

/** Modals on screen that cover the whole screen (React Native's presentationStyle="fullScreen"). */
const openFullScreenModals = () =>
  screen.container.queryAll(
    (node) => node.props.presentationStyle === 'fullScreen' && node.props.visible === true,
  );

test('opens the calendar from anywhere on the date field, which can’t be typed in', async () => {
  const dateField = screen.getByLabelText(/^Date/);
  expect(within(dateField).getByPlaceholderText('MM/DD/YYYY')).toHaveProp('editable', false);

  await pickDate(3);
  expect(screen.getByLabelText('Date, 10/03/2026')).toBeOnTheScreen();
});

test('shows the calendar full screen, without the "Select date" header or its pencil', async () => {
  await fireEvent.press(screen.getByLabelText(/^Date/));

  expect(screen.getByLabelText('Choose date')).toBeOnTheScreen();
  expect(openFullScreenModals()).toHaveLength(1);
  expect(screen.queryByText(/select date/i)).not.toBeOnTheScreen();
  expect(screen.queryByTestId('react-native-paper-dates-toggle-edit')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('Save')).toBeDisabled(); // nothing chosen yet

  // Close keeps the field as it was.
  await fireEvent.press(screen.getByLabelText('Close'));
  expect(screen.getByLabelText('Date')).toBeOnTheScreen();
});

test('shows the time picker full screen, like the calendar, and saves only on Save', async () => {
  await fireEvent.press(screen.getByLabelText(/^Time/));

  expect(screen.getByLabelText('Choose a start and end time')).toBeOnTheScreen();
  expect(openFullScreenModals()).toHaveLength(1);
  expect(screen.getByLabelText('Save')).toBeDisabled();

  await fireEvent.press(screen.getByLabelText('Start 9:00 AM'));
  await fireEvent.press(screen.getByLabelText('End 11:00 AM, 2 hours'));
  expect(screen.getByLabelText('Save')).toBeEnabled();

  // Close throws the picks away...
  await fireEvent.press(screen.getByLabelText('Close'));
  expect(screen.getByLabelText('Time')).toBeOnTheScreen();

  // ...and Save keeps them.
  await pickTime('9:00 AM', '11:00 AM');
  expect(screen.getByLabelText('Time, 9:00 AM – 11:00 AM')).toBeOnTheScreen();
});

test('only offers end times 2 to 8 hours after the start, every half hour', async () => {
  await fireEvent.press(screen.getByLabelText(/^Time/));
  await fireEvent.press(screen.getByLabelText('Start 9:00 AM'));

  const ends = screen.getAllByLabelText(/^End \d/);
  expect(ends).toHaveLength(13);
  expect(ends[0]).toHaveAccessibleName('End 11:00 AM, 2 hours');
  expect(ends.at(-1)).toHaveAccessibleName('End 5:00 PM, 8 hours');

  await fireEvent.press(screen.getByLabelText('End 11:30 AM, 2.5 hours'));
  await fireEvent.press(screen.getByLabelText('Save'));
  expect(screen.getByLabelText('Time, 9:00 AM – 11:30 AM')).toBeOnTheScreen();
  expect(screen.getByText('2.5 hours')).toBeOnTheScreen();
});

test('stops the end times at closing (9:00 PM)', async () => {
  await fireEvent.press(screen.getByLabelText(/^Time/));
  // The last start that still leaves 2 hours before closing.
  expect(screen.getAllByLabelText(/^Start \d/).at(-1)).toHaveAccessibleName('Start 7:00 PM');

  await fireEvent.press(screen.getByLabelText('Start 6:00 PM'));
  expect(screen.getAllByLabelText(/^End \d/).map((end) => end.props.accessibilityLabel)).toEqual([
    'End 8:00 PM, 2 hours',
    'End 8:30 PM, 2.5 hours',
    'End 9:00 PM, 3 hours',
  ]);
});

test('prices several pets with the base charge once, and updates as pets are added', async () => {
  const total = () => screen.getByTestId('total-price');
  expect(total()).toHaveTextContent('$20'); // just the base charge until there's something to price

  await fillPet(0, 'Oscar', 'Dog');
  expect(total()).toHaveTextContent('$20'); // no time picked yet
  await pickTime('9:00 AM', '5:00 PM');
  expect(total()).toHaveTextContent('$100'); // $20 base + 8 hours at $10

  await fireEvent.press(screen.getByText('Add another pet'));
  await fillPet(1, 'Sulley', 'Dog');
  expect(total()).toHaveTextContent('$180'); // base charged once, not per pet

  // Itemized under each name, not written as an equation.
  const sulley = screen.getByLabelText('Sulley price');
  expect(sulley).toHaveTextContent(/8 hours/);
  expect(sulley).toHaveTextContent(/\$10 per hour/);
  expect(sulley).toHaveTextContent(/\$80$/);

  await fireEvent.press(screen.getByText('Add another pet'));
  await fillPet(2, 'Hamlet', 'Pig');
  expect(total()).toHaveTextContent('$340');

  await fireEvent.press(screen.getByLabelText('Remove Hamlet'));
  expect(total()).toHaveTextContent('$180');
});

test('keeps submit disabled until every input is filled in', async () => {
  expect(submitButton()).toBeDisabled();

  await fillName('Jordan', 'Rivera');
  await fillPet(0, 'Oscar', 'Dog');
  await fireEvent.press(screen.getByText('Add another pet'));
  await fillPet(1, 'Sulley', 'Dog');
  await pickDate(3);
  expect(submitButton()).toBeDisabled(); // no time yet

  await pickTime('9:00 AM', '11:00 AM');
  expect(submitButton()).toBeEnabled();

  // Emptying any input disables it again.
  await fireEvent.changeText(screen.getByLabelText('Last name'), '');
  expect(submitButton()).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Last name'), 'Rivera');

  await fireEvent.press(screen.getByText('Add another pet'));
  expect(submitButton()).toBeDisabled(); // the new pet is empty
  await fireEvent.press(screen.getByLabelText('Remove Pet 3'));

  await fireEvent.press(submitButton());
  expect(await screen.findByText('Booked Oscar and Sulley.')).toBeOnTheScreen();

  // The form starts over clean: empty, and with no errors (the time used to say "Choose a start
  // and end time" here).
  expect(screen.getByLabelText('Time')).toBeOnTheScreen();
  expect(screen.queryByText('Choose a start and end time')).not.toBeOnTheScreen();
  expect(submitButton()).toBeDisabled();
});
