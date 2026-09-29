import { resetMockApi } from '@pet-sitting/shared/mock-api';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MobileApp } from '../MobileApp';

/**
 * Steps for driving the mobile app in tests, the counterpart of web/e2e/bookingFormHelpers.ts.
 * "Now" is noon on 1 Oct 2026, as in the web tests, and the mock API answers at once.
 */
export async function renderApp() {
  // The clock only moves when a test moves it: RNTL's findBy* queries advance it inside act(), and
  // so do the afterEach hook's pending timers. A clock that ticked on its own (advanceTimers) let
  // Paper's animation frames land between steps, outside act(), and warn.
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 12) });
  resetMockApi({ latencyMs: 0 });
  await render(<MobileApp />);
  await layOut(); // Paper's tab bar ignores touches until it has been measured
}

/**
 * Some views wait for a layout event before they work: the calendar sizes itself before drawing its
 * days, and Paper's tab bar takes no touches until it's measured. Jest has no layout engine, so
 * send every view that listens a phone-sized layout (a few rounds, as new views appear).
 */
async function layOut() {
  const layout = {
    persist: () => {},
    nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 640 } },
  };
  for (let round = 0; round < 3; round++) {
    for (const node of screen.container.queryAll((n) => typeof n.props.onLayout === 'function')) {
      await fireEvent(node, 'layout', layout);
    }
  }
}

/** Opens the date field labelled `label` and picks a day in October 2026. */
export async function pickDate(day: number, label = 'Date') {
  await fireEvent.press(screen.getByLabelText(new RegExp(`^${label}`)));
  await layOut();
  await fireEvent.press(screen.getByTestId(`react-native-paper-dates-day-2026-9-${day}`));
  await fireEvent.press(screen.getByLabelText('Save'));
}

/** Opens the time field, picks a start, then an end ('9:00 AM', '5:00 PM'), and saves. */
export async function pickTime(start: string, end: string) {
  await fireEvent.press(screen.getByLabelText(/^Time/));
  await fireEvent.press(screen.getByLabelText(`Start ${start}`));
  await fireEvent.press(screen.getByLabelText(new RegExp(`^End ${end},`)));
  await fireEvent.press(screen.getByLabelText('Save'));
}

/** Fills in pet number `index` (from 0). */
export async function fillPet(index: number, name: string, type: 'Dog' | 'Cat' | 'Pig') {
  await fireEvent.changeText(screen.getByLabelText(`Pet ${index + 1} name`), name);
  await fireEvent.press(screen.getByLabelText(`Pet ${index + 1} ${type}`));
}

export async function fillName(firstName: string, lastName: string) {
  await fireEvent.changeText(screen.getByLabelText('First name'), firstName);
  await fireEvent.changeText(screen.getByLabelText('Last name'), lastName);
}

export const submitButton = () => screen.getByRole('button', { name: /Request a sitter|Booking…/ });
