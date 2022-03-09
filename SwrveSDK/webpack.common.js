const path = require("path");
const merge = require("webpack-merge");

const baseConfig = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                noEmit: false,
                sourceMap: true,
              },
            },
          },
        ],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js", // The left hand key of the 'entry' section defines what [name] is
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", "json"],
  },
};

const swrveWorkerConfig = {
  entry: {
    SwrveWorker: path.resolve(__dirname, "src/SwrveWorker.js"),
  },
};

const swrveSDKConfig = {
  entry: {
    SwrveSDK: path.resolve(__dirname, "src/SwrveSDK.ts"),
  },
  output: {
    library: "SwrveSDK",
    libraryTarget: "umd",
  },
};

module.exports = [
  merge(baseConfig, swrveSDKConfig),
  merge(baseConfig, swrveWorkerConfig),
];
