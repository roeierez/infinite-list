
module.exports = {
    entry: {
        simple: ['./src/simple.js'],
        recycling: ['./src/recycling.js'],
        paging: ['./src/paging.js'],
        react: ['./src/react.js'],
        flickr: ['./src/twitter.js']
    },
    output: {
        path: './build',
        filename: '[name]_example.js',
        library: "listExample",
        libraryTarget: "umd"
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, exclude: /node_modules/, loader: "jsx-loader"}
        ]
    }
};