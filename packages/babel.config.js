module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-typescript",
  ],
  plugins: [
    ["@babel/plugin-proposal-decorators", { version: "legacy" }],
    "@babel/plugin-proposal-class-properties",
  ],
  assumptions: {
    setPublicClassFields: true,
  }
};
