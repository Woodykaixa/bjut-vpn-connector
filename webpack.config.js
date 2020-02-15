const path = require('path')
module.exports = {
    entry: {
        popup: path.join(__dirname, '/popup.ts'),
        background: path.join(__dirname, '/background.ts'),
        options: path.join(__dirname, '/options.ts')
    },
    mode: 'production',
    output: {
        path: path.join(__dirname, '/'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    }
}