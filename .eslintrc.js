module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['prettier', 'eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js'],
      rules: {
        semi: 0,
        'react-native/no-inline-styles': 0,
        'react-hooks/exhaustive-deps': 0,
        '@typescript-eslint/no-shadow': ['error'],
        'no-shadow': 'off',
        'no-undef': 'off',
        'prefer-const': 'off',
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    'react/prop-types': 0,
  },
  ignorePatterns: ['**/*.json', '**/graphql/index.ts'],
}
