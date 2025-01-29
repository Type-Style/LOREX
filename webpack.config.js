const path = require('path');
const { defineReactCompilerLoaderOption, reactCompilerLoader } = require('react-compiler-webpack');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (args) => {
  const mode = args.mode || 'development';
  return {
    mode: mode,
    entry: './src/client/index.tsx',
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'src/client/tsconfig.json',
              },
            },
           
          ],

          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: true,
              },
            },
          ],
          include: /\.module\.css$/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
          exclude: /\.module\.css$/,
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
    optimization: {
      minimize: mode === 'production',
    },
    plugins: [
      // Uncomment if you want to analyze the bundle
      // new BundleAnalyzerPlugin(),
    ],
  }
}
