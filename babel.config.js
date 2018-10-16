module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          browsers: [
            '>0.25%',
            'not dead',
            'not ie 11',
            'not op_mini all',
            'not android <= 4.4',
            'not samsung <= 4',
          ],
        },
        useBuiltIns: 'usage',
      },
    ],
    '@babel/preset-react',
    '@babel/preset-flow',
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    'lodash',
    'webpack-chunkname',
    'dynamic-import-node',
  ],
  overrides: [
    {
      test: './src/server',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '8.11',
            },
          },
        ],
      ],
    },
    {
      test: './src/client/vendor',
      compact: true,
    },
  ],
};
