const webpack = require('webpack');
const path = require('path');

/** Webpack Plugins */
const CleanWebpackPlugin = require('clean-webpack-plugin');
const TypedocWebpackPlugin = require('typedoc-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const isDocs = nodeEnv === 'generatedocs';
const pathsToClean = ['./dist'];

const plugins = [
  new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify(nodeEnv)
    }
  }),
  new CleanWebpackPlugin(pathsToClean)
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

module.exports = {
  entry: {
    SwrveSDK: './src/SwrveSDK.ts',
		SwrveWorker: './src/SwrveWorker.js',
	},
  devtool: 'inline-source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // The left hand key of the 'entry' section defines what [name] is
    library: "SwrveSDK",
    publicPath: '/dist'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use:[{
          loader: 'tslint-loader',
          options: {
            failOnHint: true,
            tsConfigFile: 'tsconfig.json'
          }
        }]
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