/* global module -- CommonJS: the mobile package isn't "type": "module". */
/**
 * Jest for the mobile app: jest-expo runs components in a React Native test environment, and React
 * Native Testing Library drives them like a user would (press, type, read the screen).
 */
module.exports = {
  preset: 'jest-expo',
  // Watchman isn't always available (CI, sandboxes); Jest's own file crawler is fast enough here.
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.after-env.ts'],
  // Jest skips node_modules when compiling. These ship untranspiled code (or TypeScript, for the
  // shared workspace package), so they have to be compiled too. The color packages are ES modules
  // that react-native-paper-dates depends on.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo/vector-icons|react-native-paper|react-native-paper-dates|color|color-string|color-convert|color-name|@pet-sitting/.*))',
  ],
};
