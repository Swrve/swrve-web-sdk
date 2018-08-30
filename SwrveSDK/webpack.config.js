const webpack = require('webpack');
const path = require('path');

/** Webpack Plugins */
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isDocs = nodeEnv === 'generatedocs';

const pathsToClean = ['dist'];
const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new CleanWebpackPlugin(pathsToClean)
];

/** Production Environment Plugins */
if (isProd) {
  /** UglifyJs */
  plugins.push(
    new UglifyJsPlugin({
      test: /\.js$/i,
      parallel: true,
      uglifyOptions: {
        ie8: false,
        ecma: 6,
        warnings: true,
        mangle: true,
        output: {
          beautify: false,
          comments: false
        }
      },
      sourceMap: true
    })
  );
}

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

module.exports = {
  entry: './src/SwrveSDK.ts',
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'SwrveSDK.js',
    // libraryTarget: "commonjs2",
    library: "SwrveSDK",
    publicPath: '/dist'
  },
  module: {
    rules: [{
        enforce: 'pre',
        test: /\.ts$/,
        loader: 'tslint-loader',
        exclude: /node_modules/,
        options: {
          failOnHint: true,
          configuration: require('./tslint.json')
        }
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: plugins
};