module.exports = {
  testEnvironment: "node",
  verbose: true,
  setupFilesAfterEnv: ["./jestConsole.ts"],
  testMatch: ["**/src/**/*.test.ts"],
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
  // transformIgnorePatterns: ["node_modules/(?!(lodash-es|ix)/)"],
};
