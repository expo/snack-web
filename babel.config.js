module.exports = api => {
  const isWebpack = api.caller(caller => Boolean(caller && caller.name === 'babel-loader'));

  return {
    presets: [
      [
        '@babel/preset-env',
        isWebpack
          ? {
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
              exclude: ["transform-typeof-symbol"],
              useBuiltIns: 'usage',
              modules: false,
            }
          : {
              targets: {
                node: '8.14',
              },
            },
      ],
      '@babel/preset-react',
      '@babel/preset-typescript',
    ],
    plugins: [
      '@babel/plugin-syntax-dynamic-import',
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-object-rest-spread',
      'lodash',
      isWebpack ? 'webpack-chunkname' : 'dynamic-import-node',
    ],
    overrides: [
      {
        test: './src/client/vendor',
        compact: true,
      },
    ],
  };
};
