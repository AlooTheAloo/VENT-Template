const CopyPlugin = require("copy-webpack-plugin");

const rules = require("./webpack.rules");
const { merge } = require("webpack-merge");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const path = require("path");
const { VueLoaderPlugin } = require("vue-loader");
const { DefinePlugin } = require("webpack");

rules.push({
  test: /\.vue$/,
  use: ["vue-loader"],
});

rules.push({
  test: /\.css$/,
  use: ["vue-style-loader", "css-loader"],
});

/*
rules.push({
  test: /\.html$/,
  //use: ["extract-loader", "ref-loader"],
  type: "asset/source",
});*/

const config = merge(
  {
    // Put your normal webpack config below here
    module: {
      rules,
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          extensions: {
            vue: {
              enabled: true,
              compiler: require.resolve("@vue/compiler-sfc"),
            },
          },
          mode: "write-tsbuildinfo",
          configFile: path.resolve(__dirname, "src", "public", "tsconfig.json"),
        },
        devServer: false,
      }),
      new VueLoaderPlugin(),
      new DefinePlugin({
        __VUE_PROD_DEVTOOLS__: global.mode === "production",
        __VUE_OPTIONS_API__: false,
      }),
    ],
  },
  require("./webpack.common.config"),
);

module.exports = (_, { mode }) => {
  global.mode = mode;
  return config;
};
