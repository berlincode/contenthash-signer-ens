// vim: sts=2:ts=2:sw=2
module.exports = {
  'parserOptions': {
    'ecmaVersion': 8
  },
  'globals': {
    'define': true
  },
  'env': {
    'commonjs': true,
    'node': true,
    'es6': true
  },
  'extends': 'eslint:recommended',
  'rules': {
    'indent': [
      'error',
      2
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'always'
    ],
    'no-warning-comments': [
      1,
      {
        'terms': ['todo', 'fixme'],
        'location': 'anywhere'
      }
    ],
    'object-curly-spacing': [
      'error',
      'never'
    ]
  }
};
