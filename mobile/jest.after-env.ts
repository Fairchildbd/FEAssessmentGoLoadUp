import { act } from '@testing-library/react-native';

afterEach(async function finishPendingAnimationsInsideAct() {
  const timersAreFaked = jest.isMockFunction(setTimeout);
  if (timersAreFaked) {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  }
});
