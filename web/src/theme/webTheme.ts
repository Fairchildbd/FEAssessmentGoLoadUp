import { createTheme } from '@mui/material/styles';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { toRem } from './toRem';

const { color, radius, typography } = designTokens;

/**
 * Web-only styling: the shared design tokens mapped onto MUI's theme. Tailwind reads the same
 * tokens in web/tailwind.config.ts, so MUI components and Tailwind classes always agree.
 */
export const webTheme = createTheme({
  palette: {
    primary: { main: color.primary, contrastText: color.onPrimary },
    secondary: { main: color.secondary, contrastText: color.onSecondary },
    error: { main: color.error, contrastText: color.onError },
    warning: { main: color.warning, contrastText: color.onWarning },
    info: { main: color.info, contrastText: color.onInfo },
    success: { main: color.success, contrastText: color.onSuccess },
    background: { default: color.background, paper: color.surface },
    text: { primary: color.onSurface, secondary: color.onSurfaceVariant },
    divider: color.outlineVariant,
  },
  shape: { borderRadius: radius.control },
  typography: {
    // System fonts load instantly and look native on every OS.
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontSize: toRem(typography.fontSize.display),
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h5: {
      fontSize: toRem(typography.fontSize.headline),
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
    },
    h6: {
      fontSize: toRem(typography.fontSize.title),
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.tight,
    },
    body1: { fontSize: toRem(typography.fontSize.body), lineHeight: typography.lineHeight.normal },
    body2: {
      fontSize: toRem(typography.fontSize.bodySmall),
      lineHeight: typography.lineHeight.normal,
    },
    caption: { fontSize: toRem(typography.fontSize.caption) },
    // MUI buttons default to UPPERCASE; LoadUp's site uses sentence case.
    button: { textTransform: 'none', fontWeight: typography.fontWeight.medium },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        // MUI's default input border is about 1.7:1 against white. The outline token meets the
        // 3:1 minimum WCAG sets for the edges of form controls.
        notchedOutline: { borderColor: color.outline },
      },
    },
  },
});
