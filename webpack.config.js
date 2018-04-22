const fs = require('fs');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const styleLoader = process.env.WEBPACK_SERVE ? 'style-loader' : MiniCssExtractPlugin.loader;

module.exports = {
  mode,

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
      { test: /\.css$/, use: [styleLoader, 'css-loader', 'postcss-loader'] },
      {
        test: /\.scss$/,
        use: [
          styleLoader,
          {
            loader: 'css-loader',
            options: {
              camelCase: 'dashesOnly',
              modules: true,
              localIdentName: mode === 'production' ? '[hash:base64]' : '[name]__[local]--[hash:base64:5]',
            },
          },
          'postcss-loader',
          'sass-loader',
        ],
      },
      { test: /\.svg$/, use: 'svg-url-loader?limit=8192' },
      { test: /\.(jpg|ttf)$/, use: 'url-loader?limit=8192' },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '[name].css' }),
  ],
  resolve: {
    extensions: ['.js', '.json', '.jsx'],
  },

  externals: [
    {
      'firebase/app': 'firebase',
      'prop-types': 'PropTypes',
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    (context, request, callback) => {
      if (request === './config.local') {
        return fs.exists(path.resolve(__dirname, 'config.local.js'), (exists) => {
          if (exists) {
            return callback();
          }
          return callback(null, '{}');
        });
      }
      return callback();
    },
  ],
};

if (process.env.WEBPACK_SERVE) {
  module.exports.serve = {
    dev: {
      publicPath: module.exports.output.publicPath,
    },
  };
}
