var Path = require("path");

module.exports = {
    entry: Path.join(__dirname,"src","js","main.jsx"),
    output: {
        path: Path.join(__dirname,"output"),
        publicPath: 'output',
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
			{
			  test: /\.jsx?$/,
			  exclude: /(node_modules|bower_components)/,
			  loader: 'babel', // 'babel-loader' is also a legal name to reference
			  query: {
				presets: ['es2015', 'react']
			  }
			}
        ]
    }
};