const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const sdkConfig = common[0];
const serviceWorkerConfig = common[1];

const isDocs = process.env.NODE_ENV === 'generatedocs';
const pathsToClean = ['./dist'];

const plugins = [
  new CleanWebpackPlugin(pathsToClean),
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false
  })
];

if (isDocs) {
  /** Typedoc */
  plugins.push(
    new TypedocWebpackPlugin({
      name: 'SwrveSDK',
      out: '../../../Docs',
      mode: 'file',
      includeDeclarations: true,
      ignoreCompilerErrors: true
    }, './src')
  );
}

const dev = {
  mode: 'development',
  plugins: plugins
};
 
module.exports = [
  merge(serviceWorkerConfig, dev),
  merge(sdkConfig, dev)
];