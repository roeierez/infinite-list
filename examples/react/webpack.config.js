
module.exports = {
    entry: {
        app: ['./js/list.js']
    },
    output: {
        path: './build',
        filename: 'listExample.js',
        library: "listExample",
        libraryTarget: "umd"
    }
};