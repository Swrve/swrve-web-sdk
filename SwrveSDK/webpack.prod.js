const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const sdkConfig = common[0];
const serviceWorkerConfig = common[1];

const prod = {
  devtool: 'cheap-source-map',
  mode: 'production',
};

module.exports = [
  merge(serviceWorkerConfig, prod),
  merge(sdkConfig, prod)
];
