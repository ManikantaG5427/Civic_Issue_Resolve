import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['log', 'info', 'warn', 'error'] }],
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^(next|_)',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'prefer-const': 'error',
    },
  },
];
