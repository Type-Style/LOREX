/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/src/testData/', '<rootDir>/src/tests/productionServer.test.ts', '<rootDir>/src/client/', '<rootDir>/e2e/'], // src/client is covered by vitest (npm run test:react), e2e/ by playwright (npm run test:e2e)
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  bail: true
};
