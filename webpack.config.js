const path = require('path');

module.exports = (args) => {
  const mode = args.mode || 'development';
  return {
    mode: mode,
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
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true,
              },
            },
          ],
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist/httpdocs/js'),
    }
  }
};
