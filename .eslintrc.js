module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.base.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    'import/no-internal-modules': ['error'],
    'import/no-unresolved': [
      'error',
      {
        ignore: ['@angular/common'],
      },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
  },
  ignorePatterns: ['**/dist/'],
  overrides: [
    {
      files: ['*.spec.ts'],
      rules: {
        'import/no-internal-modules': 'off',
      },
    },
  ],
}
