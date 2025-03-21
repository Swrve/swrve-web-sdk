const merge = require("webpack-merge");
const common = require("./webpack.common.js");
const TerserPlugin = require('terser-webpack-plugin');

const sdkConfig = common[0];
const serviceWorkerConfig = common[1];

const prod = {
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
            pure_funcs: [
              'SwrveLogger.debug',
              'SwrveLogger.info',
              'SwrveLogger.warn',
            ],
          },
        },
      }),
    ],
  },
};

module.exports = [merge(sdkConfig, prod), merge(serviceWorkerConfig, prod)];