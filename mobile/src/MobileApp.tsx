import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileStarterScreen } from './screens/MobileStarterScreen';
import { mobileTheme } from './theme/mobileTheme';

/** Root of the mobile app: platform providers around the current screen. */
export function MobileApp() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={mobileTheme}>
        <MobileStarterScreen />
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
