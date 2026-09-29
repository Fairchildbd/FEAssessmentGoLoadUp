const palette = {
  teal50: '#e4f9f9',
  teal300: '#4ed3cf',
  teal600: '#0a9e9a',
  teal800: '#087a77',
  teal900: '#0b4f4d',
  lime300: '#ccff00',
  white: '#ffffff',
  gray50: '#f7f8f9',
  gray200: '#e2e2e2',
  gray500: '#747474',
  gray700: '#555555',
  black: '#0a0a0a',
  red50: '#fee2e2',
  red700: '#b91c1c',
  red900: '#7f1d1d',
  green700: '#15803d',
  amber700: '#b45309',
  blue700: '#1d4ed8',
} as const;

const color = {
  primary: palette.teal800,
  onPrimary: palette.white,
  primaryContainer: palette.teal50,
  onPrimaryContainer: palette.teal900,
  secondary: palette.black,
  onSecondary: palette.white,
  secondaryContainer: palette.lime300,
  onSecondaryContainer: palette.black,
  background: palette.gray50,
  onBackground: palette.black,
  surface: palette.white,
  onSurface: palette.black,
  onSurfaceVariant: palette.gray700,
  outline: palette.gray500,
  outlineVariant: palette.gray200,
  error: palette.red700,
  onError: palette.white,
  errorContainer: palette.red50,
  onErrorContainer: palette.red900,
  success: palette.green700,
  onSuccess: palette.white,
  warning: palette.amber700,
  onWarning: palette.white,
  info: palette.blue700,
  onInfo: palette.white,
  navigationBar: palette.teal800,
  onNavigationBar: palette.white,
  navigationIndicator: palette.gray200,
  onNavigationIndicator: palette.teal900,
} as const;

const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

const radius = { control: 8, card: 16, pill: 9999 } as const;

const typography = {
  fontSize: { caption: 12, bodySmall: 14, body: 16, title: 20, headline: 24, display: 32 },
  fontWeight: { regular: 400, medium: 500, bold: 700 },
  lineHeight: { tight: 1.25, normal: 1.5 },
} as const;

export const designTokens = { palette, color, spacing, radius, typography } as const;

export type DesignTokens = typeof designTokens;
export type ColorRole = keyof typeof color;
