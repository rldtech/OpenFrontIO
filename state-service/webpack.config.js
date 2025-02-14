const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  target: "node",
  mode: "development",
  entry: "./src/Server.ts",
  externals: [nodeExternals()],
  ignoreWarnings: [
    {
      module: /pg-native/,
    },
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
      "pg-native": false,
    },
  },
  output: {
    filename: "Server.js",
    path: path.resolve(__dirname, "dist"),
  },
};
