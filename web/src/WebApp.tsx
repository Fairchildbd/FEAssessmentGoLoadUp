import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { WebBookingPage } from './pages/WebBookingPage';
import { webTheme } from './theme/webTheme';

/**
 * Root of the web app: platform providers around the current page.
 *
 * `enableCssLayer` puts MUI's styles in a CSS cascade layer named "mui". Tailwind's classes are
 * not layered, so they always win over MUI's defaults (see web/src/theme/tailwind.css).
 */
export function WebApp() {
  return (
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={webTheme}>
        <CssBaseline />
        {/* Date pickers work in date-fns Dates, like the rest of the repo. */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <WebBookingPage />
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
