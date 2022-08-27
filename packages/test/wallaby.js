// const fs = require("fs");
// const path = require("path");

module.exports = () => {
  // const nodeVersion = fs.readFileSync(".nvmrc", { encoding: "utf8" }).trim();
  // const vVersion = "v" + nodeVersion;
  // const nodePath = path.join(
  //   process.env.HOME,
  //   ".nvm",
  //   "versions",
  //   "node",
  //   vVersion,
  //   "bin",
  //   "node"
  // );

  return {
    autoDetect: true,
    trace: true,
    testFramework: {
      configFile: "./jest.config.js",
    },
    // env: {
    //   type: "node",
    //   runner: nodePath,
    // },
    files: [
      "src/**/test/data/**",
      "src/**/*.ts",
      { pattern: "**/src/**/*.test.ts", ignore: true },
    ],
    tests: ["src/**/*.test.ts"],
  };
};