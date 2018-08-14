module.exports = {
  displayName: 'snack-integration',
  rootDir: '..',
  testMatch: ['**/__integration-tests__/**/*.js'],
  testEnvironment: '<rootDir>/jest/integration-environment.js',
  setupTestFrameworkScriptFile: '<rootDir>/jest/integration-setup-framework.js',
  globalSetup: '<rootDir>/jest/integration-global-setup.js',
  globalTeardown: '<rootDir>/jest/integration-global-teardown.js',
};
