import { resetMockApi } from '@pet-sitting/shared/mock-api';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MobileApp } from '../MobileApp';

export async function renderApp() {
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 12) });
  resetMockApi({ latencyMs: 0 });
  await render(<MobileApp />);
  await simulateLayoutForViewsThatWaitForIt();
}

async function simulateLayoutForViewsThatWaitForIt() {
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

export async function pickDate(day: number, label = 'Date') {
  await fireEvent.press(screen.getByLabelText(new RegExp(`^${label}`)));
  await simulateLayoutForViewsThatWaitForIt();
  await fireEvent.press(screen.getByTestId(`react-native-paper-dates-day-2026-9-${day}`));
  await fireEvent.press(screen.getByLabelText('Save'));
}

export async function pickTime(start: string, end: string) {
  await fireEvent.press(screen.getByLabelText(/^Time/));
  await fireEvent.press(screen.getByLabelText(`Start ${start}`));
  await fireEvent.press(screen.getByLabelText(new RegExp(`^End ${end},`)));
  await fireEvent.press(screen.getByLabelText('Save'));
}

export async function fillPet(index: number, name: string, type: 'Dog' | 'Cat' | 'Pig') {
  await fireEvent.changeText(screen.getByLabelText(`Pet ${index + 1} name`), name);
  await fireEvent.press(screen.getByLabelText(`Pet ${index + 1} ${type}`));
}

export async function fillName(firstName: string, lastName: string) {
  await fireEvent.changeText(screen.getByLabelText('First name'), firstName);
  await fireEvent.changeText(screen.getByLabelText('Last name'), lastName);
}

export const submitButton = () => screen.getByRole('button', { name: /Request a sitter|Booking…/ });
