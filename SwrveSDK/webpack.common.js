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
    // Build the bundle from the public entry point (index.ts) so ALL runtime
    // exports (enums like SwrvePushInboxMessageState, ResourceManager, etc.)
    // are included — not just the SwrveSDK class. The type declarations already
    // point at index.ts, so this aligns the runtime bundle with the types.
    SwrveSDK: path.resolve(__dirname, "src/index.ts"),
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
