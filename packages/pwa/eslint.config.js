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
  // Relaxations below are scoped to legacy `src/` (and root `*.ts`) only: the
  // codebase predates these conventions. Newer code such as `e2e/` is
  // intentionally not listed here, so it keeps the shared recommended baseline
  // rather than these relaxations. Do not widen this glob to unify the regimes;
  // that would only loosen the newer code (#621).
  {
    files: ['src/**/*.ts', '*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      // No type-aware lint rules are enabled (the non-type-checked `recommended`
      // set only), so `parserOptions.project` is intentionally omitted: it would
      // build a TypeScript program per file for no consuming rule. Re-add it only
      // if a type-aware rule is enabled (#621).
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
    // (.git/info/exclude, not .gitignore); .dependency-cruiser.cjs is tracked;
    // the Ohm grammar bundle is generated code that is deliberately tracked but
    // must skip lint (it uses require/module). It was previously excluded only by
    // a stale, path-wrong .gitignore line; that exclusion lives here now (#637).
    ignores: [
      'tests-local/',
      'probes/',
      '.dependency-cruiser.cjs',
      'src/ohmjs/ly-grammar.ohm-bundle.*',
    ],
  }
)
