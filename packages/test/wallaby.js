module.exports = () => {
  return {
    autoDetect: true,
    trace: true,
    testFramework: {
      configFile: "./jest.config.js",
    },
    files: ["src/**/*.ts"],
    tests: ["src/**/*.test.ts"],
  };
};