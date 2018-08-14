/* eslint-disable import/no-commonjs */

const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { StatsWriterPlugin } = require('webpack-stats-plugin');

function env(key, def) {
  let value = process.env[key];

  if (value !== undefined) {
    return value;
  }

  throw new Error(`Environment variable ${key} isn't specified`);
}

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map',
  entry: {
    // Main bundle
    app: './snack/index',

    // Service worker
    sw: './snack/sw',

    // Language web workers
    'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker',
    'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
    'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker',
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: '[name].bundle.js',
    chunkFilename: '[id].[hash].chunk.js',
  },
  optimization: {
    noEmitOnErrors: true,
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new UglifyJsPlugin({
        exclude: /eslint_bundle/,
        parallel: true,
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_SERVER_URL: JSON.stringify(env('API_SERVER_URL')),
        SNACK_SEGMENT_KEY: JSON.stringify(env('SNACK_SEGMENT_KEY')),
        IMPORT_SERVER_URL: JSON.stringify(env('IMPORT_SERVER_URL')),
        BUILD_TIMESTAMP: JSON.stringify(Date.now()),
      },
    }),
    new MiniCssExtractPlugin(),
    new webpack.IgnorePlugin(
      /^((fs)|(path)|(os)|(crypto)|(source-map-support))$/,
      /vs(\/|\\)language(\/|\\)typescript(\/|\\)lib/
    ),
    new webpack.ContextReplacementPlugin(
      /monaco-editor(\\|\/)esm(\\|\/)vs(\\|\/)editor(\\|\/)common(\\|\/)services/
    ),
    new StatsWriterPlugin({
      filename: 'build-stats.js',
      fields: ['hash', 'assets'],
      transform: ({ hash, assets }) => `
        // This script is used in the service worker
        self.__WEBPACK_BUILD_STATS__ = ${JSON.stringify({
          hash,
          assets: assets.map(a => `/dist/${a.name}`).filter(a => !a.endsWith('.map')),
        })}
      `,
    }),
  ],
  module: {
    rules: [
      {
        // graphql-request includes this polyfill
        test: path.resolve(__dirname, 'node_modules/cross-fetch/dist/browser-polyfill.js'),
        use: 'null-loader',
      },
      {
        test: /\.worker\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'worker-loader',
          options: {
            name: '[name].[hash].js',
          },
        },
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|(vendor\/.+.bundle\.js))/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            outputPath: 'assets/',
          },
        },
      },
    ],
  },
};
