module.exports = () => {
  return {
    autoDetect: true,
    trace: true,
    testFramework: {
      configFile: "./jest.config.js",
    },
    files: ["src/**/*.ts", { pattern: "src/**/*.test.ts", ignore: true }],
    tests: ["src/**/*.test.ts"],
  };
};
