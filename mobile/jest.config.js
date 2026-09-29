const packagesJestMustCompile = [
  '(jest-)?react-native',
  '@react-native(-community)?',
  'expo(nent)?',
  '@expo(nent)?/.*',
  '@expo/vector-icons',
  'react-native-paper',
  'react-native-paper-dates',
  'color',
  'color-string',
  'color-convert',
  'color-name',
  '@pet-sitting/.*',
];

module.exports = {
  preset: 'jest-expo',
  watchman: false,
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.after-env.ts'],
  transformIgnorePatterns: [`node_modules/(?!(${packagesJestMustCompile.join('|')}))`],
};
