var webpack = require('webpack');

module.exports = {
    entry: {
        app: ['./src/InfiniteList.js']
    },
    output: {
        path: './dist',
        filename: 'InfiniteList.min.js',
        library: "InfiniteList",
        libraryTarget: "umd"
    },
	plugins: [
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    ]
};