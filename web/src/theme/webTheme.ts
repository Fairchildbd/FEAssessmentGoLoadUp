import { createTheme } from '@mui/material/styles';
import { designTokens } from '@pet-sitting/shared/design-tokens';
import { toRem } from './toRem';

const { color, radius, typography } = designTokens;

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
    button: { textTransform: 'none', fontWeight: typography.fontWeight.medium },
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: color.outline },
      },
    },
  },
});
