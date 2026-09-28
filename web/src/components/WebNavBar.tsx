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
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      className="border-0 border-b border-solid border-outline-variant"
    >
      <Toolbar className="gap-lg">
        <Typography component="span" variant="h6" className="font-bold">
          Pet Sitting
        </Typography>
        <nav aria-label="Main">
          <Tabs value={current} aria-label="Pages">
            {PAGES.map((page) => (
              <Tab
                key={page.path}
                label={page.label}
                value={page.path}
                component={Link}
                to={page.path}
              />
            ))}
          </Tabs>
        </nav>
      </Toolbar>
    </AppBar>
  );
}
