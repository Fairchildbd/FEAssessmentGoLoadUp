import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const platformOnly =
  'shared/ runs on web and mobile. Put platform-specific code in web/ or mobile/.';

// Metro doesn't tree-shake: a single `import { format } from 'date-fns'` added about 200 KB to the
// iOS bundle. Importing each function from its own path keeps only what's used.
const dateFnsRoot = {
  name: 'date-fns',
  message: "Import each function from its own path, e.g. 'date-fns/format'.",
};

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/.expo/',
    'mobile/ios/',
    'mobile/android/',
    'web/playwright-report/',
    'web/test-results/',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    rules: { 'no-restricted-imports': ['error', { paths: [dateFnsRoot] }] },
  },
  {
    // Keeps shared/ platform-agnostic: no web or mobile libraries, no browser-only globals.
    files: ['shared/**/*.{ts,tsx}'],
    rules: {
      // Rule options replace, not merge, so this repeats the date-fns rule from above.
      'no-restricted-imports': [
        'error',
        {
          paths: [dateFnsRoot],
          patterns: [
            {
              group: [
                'react-dom',
                'react-dom/*',
                'react-native',
                'react-native-*',
                '@mui/*',
                'expo*',
              ],
              message: platformOnly,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'navigator'].map((name) => ({
          name,
          message: platformOnly,
        })),
      ],
    },
  },
  {
    // Mobile styles live in StyleSheet.create, not inline objects: they're named, created once
    // instead of on every render, and kept together at the bottom of each file. Matches any
    // style-like prop (style, contentStyle, contentContainerStyle, ...) given an object literal,
    // directly or inside an array.
    files: ['mobile/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name=/[sS]tyle$/] > JSXExpressionContainer > ObjectExpression, JSXAttribute[name.name=/[sS]tyle$/] > JSXExpressionContainer > ArrayExpression > ObjectExpression',
          message: 'Move this style into a StyleSheet.create at the bottom of the file.',
        },
      ],
    },
  },
  // Last, so formatting is left to Prettier.
  prettier,
);
