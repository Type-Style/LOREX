const path = require('path');

module.exports = {
  entry: './src/client/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
					loader: 'ts-loader',
					options: {
						configFile: 'src/client/tsconfig.json'
					}
				},
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/httpdocs/js'),
  },
};
