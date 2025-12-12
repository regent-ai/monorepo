module.exports = {
  extends: ['@regent/eslint-config'],
  env: {
    node: true,
    es2022: true,
  },
  globals: {
    Bun: 'readonly',
    RequestInfo: 'readonly',
    RequestInit: 'readonly',
  },
};
