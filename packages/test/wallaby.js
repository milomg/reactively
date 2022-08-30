module.exports = () => {
  return {
    autoDetect: true,
    trace: true,
    debug: true,
    testFramework: {
      configFile: "./jest.config.js",
    },
    files: [
      "src/**/*.ts",
      // "./../decorate/src/**/*.ts",
      { pattern: "src/**/*.test.ts", ignore: true },
    ],
    tests: ["src/**/*.test.ts"],
    // setup: function (wallaby) {
    //   const config = require("./jest.config.js");
    //   Object.keys(config.moduleNameMapper).forEach(
    //     (k) =>
    //       (config.moduleNameMapper[k] = config.moduleNameMapper[k].replace(
    //         "<rootDir>",
    //         wallaby.localProjectDir
    //       ))
    //   );
    //   wallaby.testFramework.configure(config);
    // },
  };
};
