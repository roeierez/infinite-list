
module.exports = {
    entry: {
        app: ['./src/InfiniteList.js']
    },
    output: {
        path: './dist',
        filename: 'InfiniteList.js',
        library: "InfiniteList",
        libraryTarget: "umd"
    }
};