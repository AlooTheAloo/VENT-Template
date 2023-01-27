const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const { merge } = require("webpack-merge");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const path = require("path");

const smp = new SpeedMeasurePlugin({
  granularLoaderData: true,
  outputFormat: "humanVerbose",
  disabled: true,
});

const config = merge(
  {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: "./src/index.ts",
    // Put your normal webpack config below here
    module: {
      rules: require("./webpack.rules"),
    },
    experiments: {
      topLevelAwait: true,
    },
    ignoreWarnings: [
      {
        module: /node_modules\/ws/,
        message: /Can't resolve/,
      },
    ],
    output: {
      publicPath: ".webpack/main/",
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          extensions: {
            vue: false,
          },
          mode: "write-tsbuildinfo",
          configFile: path.resolve(__dirname, "src", "tsconfig.json"),
        },
        devServer: false,
      }),
    ],
  },
  require("./webpack.common.config"),
);

module.exports = (_, { mode }) => {
  global.mode = mode;
  return config;
};
