module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current',
        browsers: ['> 1%', 'last 2 versions', 'not dead']
      },
      modules: 'commonjs'
    }],
    ['@babel/preset-react', {
      runtime: 'automatic'
    }]
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator'
  ],
  env: {
    test: {
      presets: [
        ['@babel/preset-env', {
          targets: {
            node: 'current'
          },
          modules: 'commonjs'
        }],
        ['@babel/preset-react', {
          runtime: 'automatic'
        }]
      ]
    }
  }
};
