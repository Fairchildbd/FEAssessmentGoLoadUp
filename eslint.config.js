import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

const sharedMustStayPlatformAgnostic =
  'shared/ runs on web and mobile. Put platform-specific code in web/ or mobile/.';

const dateFnsRootImport = {
  name: 'date-fns',
  message: "Import each function from its own path, e.g. 'date-fns/format'.",
};

const anyStyleProp = 'JSXAttribute[name.name=/[sS]tyle$/] > JSXExpressionContainer';
const inlineStyleObject = `${anyStyleProp} > ObjectExpression`;
const inlineStyleObjectInArray = `${anyStyleProp} > ArrayExpression > ObjectExpression`;

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
    rules: { 'no-restricted-imports': ['error', { paths: [dateFnsRootImport] }] },
  },
  {
    files: ['shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [dateFnsRootImport],
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
              message: sharedMustStayPlatformAgnostic,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'localStorage', 'sessionStorage', 'navigator'].map((name) => ({
          name,
          message: sharedMustStayPlatformAgnostic,
        })),
      ],
    },
  },
  {
    files: ['mobile/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: [inlineStyleObject, inlineStyleObjectInArray].join(', '),
          message: 'Move this style into a StyleSheet.create at the bottom of the file.',
        },
      ],
    },
  },
  {
    files: ['mobile/jest.config.js'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
