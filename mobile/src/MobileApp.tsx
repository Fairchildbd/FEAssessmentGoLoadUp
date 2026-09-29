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

type TabRoute = (typeof ROUTES)[number];

const ADMIN_TAB_INDEX = ROUTES.findIndex((route) => route.key === 'admin');

export function MobileApp() {
  const [index, setIndex] = useState(0);
  const [adminDate, setAdminDate] = useState(() => format(new Date(), DATE_FORMAT));
  const [adminTabOpenCount, setAdminTabOpenCount] = useState(0);

  const changeTab = (next: number) => {
    if (next === ADMIN_TAB_INDEX) setAdminTabOpenCount((count) => count + 1);
    setIndex(next);
  };
  const showDayInAdmin = (date: string) => {
    setAdminDate(date);
    changeTab(ADMIN_TAB_INDEX);
  };
  const navigationState = { index, routes: ROUTES };

  const renderLabel = ({ route }: { route: TabRoute }) => (
    <Text variant="labelMedium" style={styles.tabLabel}>
      {route.title}
    </Text>
  );
  const renderScene = ({ route }: { route: TabRoute }) =>
    route.key === 'book' ? (
      <MobileBookingScreen onShowDay={showDayInAdmin} />
    ) : (
      <MobileAdminScreen key={adminTabOpenCount} date={adminDate} onDateChange={setAdminDate} />
    );

  return (
    <SafeAreaProvider>
      <PaperProvider theme={mobileTheme}>
        <SafeAreaView style={styles.root} edges={['top']}>
          <BottomNavigation
            navigationState={navigationState}
            onIndexChange={changeTab}
            barStyle={styles.tabBar}
            activeIndicatorStyle={styles.tabIndicator}
            activeColor={color.onNavigationIndicator}
            inactiveColor={color.onNavigationBar}
            renderLabel={renderLabel}
            renderScene={renderScene}
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
