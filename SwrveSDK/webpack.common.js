
 const path = require('path');
 const merge = require('webpack-merge');
  
 const baseConfig = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use:[{
          loader: 'tslint-loader',
          options: {
            failOnHint: false,
            tsConfigFile: 'tsconfig.json'
          }
        }]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js', // The left hand key of the 'entry' section defines what [name] is
    publicPath: '/dist'
  },
  resolve: {
    extensions: [".ts", ".js"]
  }
};

const swrveWorkerConfig = {
  entry: {
    SwrveWorker: './src/SwrveWorker.js'
	}
};

const swrveSDKConfig = {
  entry: {
    SwrveSDK: './src/SwrveSDK.ts'
	},
  output: {
    library: "SwrveSDK",
    libraryTarget: "umd",
  }
};

module.exports = [
  merge(baseConfig, swrveSDKConfig),
  merge(baseConfig, swrveWorkerConfig)
];
