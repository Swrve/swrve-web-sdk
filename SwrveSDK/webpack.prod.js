const merge = require("webpack-merge");
const common = require("./webpack.common.js");

const sdkConfig = common[0];

// Strip development logs
sdkConfig.module.rules[0].use = sdkConfig.module.rules[0].use.concat(
  [
    {
      loader: "strip-loader",
      options: {
        strip: [
          "SwrveLogger.debug",
          "SwrveLogger.info",
          "SwrveLogger.warn",
        ],
      },
    }
  ]
)
const serviceWorkerConfig = common[1];

const prod = {
  mode: "production",
};

module.exports = [merge(sdkConfig, prod), merge(serviceWorkerConfig, prod)];
