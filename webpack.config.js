const path = require('path');

module.exports = {
  entry: './index',
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
    react: 'React',
    'react-dom': 'ReactDOM',
  },

  serve: {
    dev: {
      publicPath: '/dist/',
    },
  },
};
