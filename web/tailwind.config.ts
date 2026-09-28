import { designTokens } from '@pet-sitting/shared/design-tokens';
import type { Config } from 'tailwindcss';
import { toRem } from './src/theme/toRem';

const { color, spacing, radius, typography } = designTokens;

const kebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** Turns a token group into a Tailwind scale, e.g. { onPrimary: '#fff' } -> { 'on-primary': '#fff' }. */
function toTailwindScale<Value>(tokens: Record<string, Value>, convert: (value: Value) => string) {
  return Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [kebabCase(name), convert(value)]),
  );
}

export default {
  // Tailwind only generates the classes it finds in these files.
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // MUI's <CssBaseline /> already resets browser styles; Tailwind's reset (preflight) would fight it.
  corePlugins: { preflight: false },
  theme: {
    // `extend` adds token-named classes and keeps all of Tailwind's defaults (p-4, text-sm, ...).
    extend: {
      colors: toTailwindScale(color, (hex) => hex), // bg-primary, text-on-surface-variant, border-outline
      spacing: toTailwindScale(spacing, toRem), // p-md, gap-sm, mt-lg
      borderRadius: toTailwindScale(radius, (px) => `${px}px`), // rounded-control, rounded-pill
      fontSize: toTailwindScale(typography.fontSize, toRem), // text-body, text-headline
    },
  },
} satisfies Config;
