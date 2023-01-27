const path = require("path");
const { DefinePlugin } = require("webpack");

module.exports = {
  output: {
    devtoolModuleFilenameTemplate: info => {
      return `file:///${encodeURI(info.absoluteResourcePath)}`;
    },
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@shared": path.resolve(__dirname, "src", "shared"),
    },
  },
  plugins: [
    new DefinePlugin({
      PROD: global.mode === "production",
    }),
  ],
};
