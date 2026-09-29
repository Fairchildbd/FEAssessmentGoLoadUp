import AppBar from '@mui/material/AppBar';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link, useLocation } from 'react-router';

const tabClasses = 'my-sm min-h-0 rounded-pill px-md py-sm text-on-navigation-bar';
const currentTabClasses =
  '[&.Mui-selected]:bg-navigation-indicator [&.Mui-selected]:text-on-navigation-indicator';
const hideMuiUnderline = 'hidden';
const tabClassName = `${tabClasses} ${currentTabClasses}`;

const PAGES = [
  { path: '/', label: 'Book a sitter' },
  { path: '/admin', label: 'Admin' },
] as const;

export function WebNavBar() {
  const { pathname } = useLocation();
  const currentPath = PAGES.find((page) => page.path === pathname)?.path ?? false;

  return (
    <AppBar position="static" elevation={0} className="bg-navigation-bar text-on-navigation-bar">
      <Toolbar className="gap-lg">
        <Typography component="span" variant="h6" className="font-bold">
          Pet Sitting
        </Typography>
        <nav aria-label="Main">
          <Tabs
            value={currentPath}
            aria-label="Pages"
            slotProps={{ indicator: { className: hideMuiUnderline } }}
          >
            {PAGES.map((page) => (
              <Tab
                key={page.path}
                label={page.label}
                value={page.path}
                component={Link}
                to={page.path}
                className={tabClassName}
              />
            ))}
          </Tabs>
        </nav>
      </Toolbar>
    </AppBar>
  );
}
