var Path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: Path.join(__dirname,"src","main.jsx"),
    output: {
      path: Path.resolve(__dirname, "dist"),
      publicPath: '/',
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
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
      ]
    },
    resolve: {
      extensions: ['', '.js', '.jsx'],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "public", to: "" },
        ],
      }),
    ],
    watchOptions: {
      poll: true,
      ignored: '**/node_modules',
    },
};