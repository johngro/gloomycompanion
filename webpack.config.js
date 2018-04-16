const path = require('path');

module.exports = {
  mode: process.env.WEBPACK_MODE || 'development',

  entry: './logic',
  output: {
    filename: 'bundle.js',
    library: 'Gloom',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
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
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.svg$/, use: 'svg-url-loader?limit=8192' },
      { test: /\.(jpg|ttf)$/, use: 'url-loader?limit=8192' },
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
};

if (process.env.WEBPACK_SERVE) {
  module.exports.serve = {
    dev: {
      publicPath: '/dist/',
    },
  };
}
