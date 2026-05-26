import jsdoc from 'eslint-plugin-jsdoc';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      jsdoc,
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
        contexts: [
          'ExportNamedDeclaration > VariableDeclaration',
        ],
      }],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-throws': 'warn',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-types': 'error',

      // ─── أتمتة جودة الكود والتعقيد الحلزوني (Super Prompt N-4) ───
      'complexity': ['error', { max: 10 }],
      'max-depth': ['error', { max: 3 }],
      'max-params': ['error', { max: 4 }],
      'max-lines-per-function': ['warn', { 
        max: 50, 
        skipBlankLines: true, 
        skipComments: true 
      }],
      'max-lines': ['warn', { 
        max: 300, 
        skipBlankLines: true, 
        skipComments: true 
      }],
    },
  },
];
