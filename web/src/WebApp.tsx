import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { BrowserRouter, Route, Routes } from 'react-router';
import { WebNavBar } from './components/WebNavBar';
import { WebAdminPage } from './pages/WebAdminPage';
import { WebBookingPage } from './pages/WebBookingPage';
import { webTheme } from './theme/webTheme';

export function WebApp() {
  return (
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={webTheme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <BrowserRouter>
            <WebNavBar />
            <Routes>
              <Route path="/" element={<WebBookingPage />} />
              <Route path="/admin" element={<WebAdminPage />} />
            </Routes>
          </BrowserRouter>
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
