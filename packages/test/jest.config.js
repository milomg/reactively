module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/*.test.ts"],
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
};
