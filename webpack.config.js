const path = require('path');

module.exports = {
  devtool: 'source-map',
  entry: './index',
  output: {
    filename: 'bundle.js',
    library: 'Gloom',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
};
