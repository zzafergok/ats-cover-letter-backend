module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
  globals: {
    NodeJS: 'readonly',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
};