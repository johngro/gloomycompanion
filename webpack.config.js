const path = require('path');

module.exports = {
  mode: process.env.WEBPACK_MODE || 'development',

  entry: './logic',
  output: {
    filename: 'bundle.js',
    library: 'Gloom',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: [
              '@babel/plugin-proposal-class-properties',
              '@babel/plugin-proposal-object-rest-spread',
            ],
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
  },

  externals: {
    'prop-types': 'PropTypes',
    react: 'React',
    'react-dom': 'ReactDOM',
  },

  serve: {
    dev: {
      publicPath: '/dist/',
    },
  },
};
