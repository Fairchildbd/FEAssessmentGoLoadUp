import AppBar from '@mui/material/AppBar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, useLocation } from 'react-router';

const PAGES = [
  { path: '/', label: 'Book a sitter' },
  { path: '/admin', label: 'Admin' },
] as const;

/**
 * Switches between the booking form and the admin page. Links change pages inside the app (no
 * reload), so the mock API's saved bookings are still there on the admin page.
 */
export function WebNavBar() {
  const { pathname } = useLocation();
  const current = PAGES.find((page) => page.path === pathname)?.path ?? false;

  return (
    // The primary green, with a soft gray pill for the current page: the mobile tab bar's colors.
    <AppBar position="static" elevation={0} className="bg-navigation-bar text-on-navigation-bar">
      <Toolbar className="gap-lg">
        <Typography component="span" variant="h6" className="font-bold">
          Pet Sitting
        </Typography>
        <nav aria-label="Main">
          <Tabs
            value={current}
            aria-label="Pages"
            // The pill marks the current page, so MUI's underline isn't needed.
            slotProps={{ indicator: { className: 'hidden' } }}
          >
            {PAGES.map((page) => (
              <Tab
                key={page.path}
                label={page.label}
                value={page.path}
                component={Link}
                to={page.path}
                // Tailwind's arbitrary variant styles MUI's .Mui-selected state class.
                className="my-sm min-h-0 rounded-pill px-md py-sm text-on-navigation-bar [&.Mui-selected]:bg-navigation-indicator [&.Mui-selected]:text-on-navigation-indicator"
              />
            ))}
          </Tabs>
        </nav>
      </Toolbar>
    </AppBar>
  );
}
