module.exports = {
  testEnvironment: "node",
  verbose: true,
  testMatch: ["**/*.test.ts"],
  transform: {
    "\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "^@reactively/(.*)$": "<rootDir>/../$1/src/$1",
  },
  projects: [
    "<rootDir>",
    "<rootDir>/../decorate",
    "<rootDir>/../core",
    "<rootDir>/../wrap",
  ],
};
