import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { format } from 'date-fns/format';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { BottomNavigation, PaperProvider, Text } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MobileAdminScreen } from './screens/MobileAdminScreen';
import { MobileBookingScreen } from './screens/MobileBookingScreen';
import { mobileTheme } from './theme/mobileTheme';

const { color } = designTokens;

// accessibilityLabel names each tab for screen readers (Paper doesn't reuse the title).
const ROUTES = [
  {
    key: 'book',
    title: 'Book a sitter',
    accessibilityLabel: 'Book a sitter',
    focusedIcon: 'calendar-plus',
  },
  {
    key: 'admin',
    title: 'Admin',
    accessibilityLabel: 'Admin',
    focusedIcon: 'clipboard-list-outline',
  },
];

/**
 * Root of the mobile app: platform providers and two tabs, the booking form and the admin schedule,
 * like the web app's nav bar. Paper's BottomNavigation keeps both tabs mounted, so a half-filled
 * form survives a look at the schedule.
 */
export function MobileApp() {
  const [index, setIndex] = useState(0);
  // The admin tab's day lives here, so the booking screen can open the day it just booked.
  const [adminDate, setAdminDate] = useState(() => format(new Date(), DATE_FORMAT));
  // Bumped each time the admin tab opens, which remounts it so it loads the latest bookings.
  const [adminVisit, setAdminVisit] = useState(0);

  const changeTab = (next: number) => {
    if (ROUTES[next]?.key === 'admin') setAdminVisit((visit) => visit + 1);
    setIndex(next);
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={mobileTheme}>
        <SafeAreaView style={styles.root} edges={['top']}>
          <BottomNavigation
            navigationState={{ index, routes: ROUTES }}
            onIndexChange={changeTab}
            // The web header's colors: the primary green, and a soft gray pill for the current tab.
            barStyle={styles.tabBar}
            activeIndicatorStyle={styles.tabIndicator}
            activeColor={color.onNavigationIndicator} // the icon, on the gray pill
            inactiveColor={color.onNavigationBar}
            // Labels sit on the green bar under the pill, so they stay white either way.
            renderLabel={({ route }) => (
              <Text variant="labelMedium" style={styles.tabLabel}>
                {route.title}
              </Text>
            )}
            renderScene={({ route }) =>
              route.key === 'book' ? (
                <MobileBookingScreen
                  onShowDay={(date) => {
                    setAdminDate(date);
                    changeTab(1);
                  }}
                />
              ) : (
                <MobileAdminScreen key={adminVisit} date={adminDate} onDateChange={setAdminDate} />
              )
            }
          />
        </SafeAreaView>
        <StatusBar style="dark" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { backgroundColor: color.navigationBar },
  tabIndicator: { backgroundColor: color.navigationIndicator },
  tabLabel: { color: color.onNavigationBar, textAlign: 'center' },
});
