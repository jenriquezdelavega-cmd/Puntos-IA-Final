import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hasTsEslintPlugin = fs.existsSync(path.join(__dirname, 'node_modules', '@typescript-eslint', 'eslint-plugin', 'package.json'));
const hasTsParser = fs.existsSync(path.join(__dirname, 'node_modules', '@typescript-eslint', 'parser', 'package.json'));
const hasNextEslintConfig = fs.existsSync(path.join(__dirname, 'node_modules', 'eslint-config-next', 'package.json'));

const files = hasTsParser ? ['**/*.{js,mjs,cjs,ts,tsx,jsx}'] : ['**/*.{js,mjs,cjs,jsx}'];
const tsParser = hasTsParser ? (await import('@typescript-eslint/parser')).default : null;

const baseConfig = [
  {
    files,
    ...(tsParser
      ? {
          languageOptions: {
            parser: tsParser,
            parserOptions: {
              ecmaFeatures: { jsx: true },
              sourceType: 'module',
            },
          },
        }
      : {}),
    rules: {},
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'scripts/**', '.backup/**'],
  },
];

let eslintConfig = baseConfig;

if (hasNextEslintConfig) {
  const nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
  const nextTs = hasTsEslintPlugin ? (await import('eslint-config-next/typescript')).default : [];
  eslintConfig = [...nextVitals, ...nextTs, ...baseConfig];
}

export default eslintConfig;
