/**
 * Platform-agnostic design tokens: the single source of truth for how both apps look.
 *
 * Plain numbers and hex strings only, so any platform can read them:
 *   web/    -> MUI theme (web/src/theme/webTheme.ts) and Tailwind (web/tailwind.config.ts)
 *   mobile/ -> React Native Paper theme (mobile/src/theme/mobileTheme.ts)
 *
 * Sizes have no units. Web reads them as CSS px (converted to rem where text should scale);
 * React Native reads them as density-independent pixels.
 */

/**
 * Raw colors. The teal, lime and neutral values come from goloadup.com's CSS. teal800 is a darker
 * teal added so primary text and buttons pass WCAG AA contrast (4.5:1) on white.
 */
const palette = {
  teal50: '#e4f9f9',
  teal300: '#4ed3cf', // LoadUp's brand teal. Decorative only: 1.8:1 on white is too light for text.
  teal600: '#0a9e9a',
  teal800: '#087a77', // 5.2:1 on white
  teal900: '#0b4f4d',
  lime300: '#ccff00', // LoadUp's accent. Pair it with near-black text only.
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

/**
 * Semantic color roles: what components should use. The names follow Material Design 3, which
 * React Native Paper uses as-is and which map onto MUI's palette. `onX` is the text or icon color
 * to put on top of `X`.
 */
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
  onSurfaceVariant: palette.gray700, // secondary text
  outline: palette.gray500, // input borders (needs 3:1 against the surface)
  outlineVariant: palette.gray200, // dividers and decorative borders
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
  // Navigation (web header, mobile tab bar): the primary green, with a soft gray pill marking the
  // current page. Dark teal on the pill reads at 7:1; the primary teal would only reach 4:1.
  navigationBar: palette.teal800,
  onNavigationBar: palette.white,
  navigationIndicator: palette.gray200,
  onNavigationIndicator: palette.teal900,
} as const;

/** Spacing on a 4px grid. */
const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

/** Corner radius named by role, not size, so the names don't clash with Tailwind's rounded-sm/md/lg. */
const radius = { control: 8, card: 16, pill: 9999 } as const;

const typography = {
  /** Font sizes named by role, for the same reason as radius. */
  fontSize: { caption: 12, bodySmall: 14, body: 16, title: 20, headline: 24, display: 32 },
  fontWeight: { regular: 400, medium: 500, bold: 700 },
  /** Multipliers of the font size (React Native needs them converted to absolute values). */
  lineHeight: { tight: 1.25, normal: 1.5 },
} as const;

export const designTokens = { palette, color, spacing, radius, typography } as const;

export type DesignTokens = typeof designTokens;
export type ColorRole = keyof typeof color;
