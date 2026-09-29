import { designTokens } from '@pet-sitting/shared/design-tokens';
import type { Config } from 'tailwindcss';
import { toRem } from './src/theme/toRem';

const { color, spacing, radius, typography } = designTokens;

const kebabCase = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function toTailwindScale<Value>(tokens: Record<string, Value>, convert: (value: Value) => string) {
  return Object.fromEntries(
    Object.entries(tokens).map(([name, value]) => [kebabCase(name), convert(value)]),
  );
}

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: toTailwindScale(color, (hex) => hex),
      spacing: toTailwindScale(spacing, toRem),
      borderRadius: toTailwindScale(radius, (px) => `${px}px`),
      fontSize: toTailwindScale(typography.fontSize, toRem),
    },
  },
} satisfies Config;
