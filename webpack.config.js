const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const makeConfig = (env = {}) => ({
  mode: env.production ? "production" : "development",
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },
  entry: "./src/client/index.ts",
  output: {
    filename: "caldera-client.js",
    path: path.resolve(__dirname, path.join("dist", "public"))
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/client/index.html"
    })
  ]
});

module.exports = makeConfig;
