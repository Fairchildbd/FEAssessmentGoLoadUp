import { designTokens } from '@pet-sitting/shared/design-tokens';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

const { color, palette, radius } = designTokens;

export const mobileTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: radius.control,
  colors: {
    ...MD3LightTheme.colors,
    primary: color.primary,
    onPrimary: color.onPrimary,
    primaryContainer: color.primaryContainer,
    onPrimaryContainer: color.onPrimaryContainer,
    secondary: color.secondary,
    onSecondary: color.onSecondary,
    secondaryContainer: color.secondaryContainer,
    onSecondaryContainer: color.onSecondaryContainer,
    background: color.background,
    onBackground: color.onBackground,
    surface: color.surface,
    onSurface: color.onSurface,
    onSurfaceVariant: color.onSurfaceVariant,
    outline: color.outline,
    outlineVariant: color.outlineVariant,
    error: color.error,
    onError: color.onError,
    errorContainer: color.errorContainer,
    onErrorContainer: color.onErrorContainer,
    surfaceVariant: color.background,
    inversePrimary: palette.teal300,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: color.surface,
      level2: color.surface,
      level3: color.surface,
      level4: color.surface,
      level5: color.surface,
    },
  },
};
