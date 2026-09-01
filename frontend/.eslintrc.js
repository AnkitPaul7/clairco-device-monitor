module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:prettier/recommended'
  ],
  plugins: ['react', 'react-hooks'],
  rules: {
    'prettier/prettier': 'error',
    'react/prop-types': 'off'
  }
};
