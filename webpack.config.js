var Path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: Path.join(__dirname,"src","js","main.jsx"),
    output: {
      path: Path.resolve(__dirname, "dist"),
    },
    module: {
      rules: [
        {
          test: /\.js$|jsx/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react']
            }
          }
        },
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: Path.join(__dirname, 'src', "index.html"),
      }),
    ],
    watch: true,
    watchOptions: {
      poll: true,
      ignored: '**/node_modules',
    },
};