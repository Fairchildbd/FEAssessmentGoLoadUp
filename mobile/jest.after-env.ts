import { act } from '@testing-library/react-native';

// Paper's animations (banner, buttons, modals) run on timers. Finish them inside act() at the end of
// each test, so none fires after the test and logs an "update was not wrapped in act(...)" warning.
afterEach(async () => {
  if (jest.isMockFunction(setTimeout)) {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  }
});
