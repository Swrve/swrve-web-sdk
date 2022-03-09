const merge = require("webpack-merge");
const common = require("./webpack.common.js");

const sdkConfig = common[0];
const serviceWorkerConfig = common[1];

const prod = {
  mode: "production",
};

module.exports = [merge(sdkConfig, prod), merge(serviceWorkerConfig, prod)];
