import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'
import { includeIgnoreFile } from 'eslint/config'
// URL is imported (rather than used as a global) so ESLint can lint this config
// file itself under no-undef, which has no node globals in scope here.
import { fileURLToPath, URL } from 'node:url'

const gitignorePath = fileURLToPath(new URL('../../.gitignore', import.meta.url))

export default tseslint.config(
  // Honour .gitignore so the ignore list is not hand-duplicated here (#509).
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/**/*.ts', '*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        project: true,
      },
    },
    rules: {
      // Style rules: codebase predates these conventions
      'no-var': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-this-alias': 'off',

      // Relaxed: TypeScript strict mode already catches the critical ones
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
  {
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    // .gitignore is honoured via includeIgnoreFile above; only paths that are
    // NOT gitignored need listing here. tests-local/ and probes/ are local-only
    // (.git/info/exclude, not .gitignore); .dependency-cruiser.cjs is tracked.
    ignores: [
      'tests-local/',
      'probes/',
      '.dependency-cruiser.cjs',
    ],
  }
)
