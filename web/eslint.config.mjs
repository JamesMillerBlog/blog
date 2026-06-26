import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettierConfig,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      complexity: ['warn', 10],
      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'prefer-arrow-callback': 'warn',
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\u2014/]',
          message: 'Use a hyphen (-) instead of an em dash (\u2014).',
        },
      ],
    },
  },
  {
    files: ['eslint.config.mjs'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    // Next.js App Router files require default function exports
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/error.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/template.tsx',
    ],
    rules: {
      'func-style': 'off',
    },
  },
]

export default eslintConfig
