import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { WebStarterPage } from './pages/WebStarterPage';
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
        <WebStarterPage />
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
