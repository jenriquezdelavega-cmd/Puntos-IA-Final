import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hasTsEslintPlugin = fs.existsSync(path.join(__dirname, 'node_modules', '@typescript-eslint', 'eslint-plugin'));
const hasTsParser = fs.existsSync(path.join(__dirname, 'node_modules', '@typescript-eslint', 'parser'));
const hasReactHooksPlugin = fs.existsSync(path.join(__dirname, 'node_modules', 'eslint-plugin-react-hooks'));
const hasNextEslintConfig = fs.existsSync(path.join(__dirname, 'node_modules', 'eslint-config-next', 'package.json'));

const rules = {};

if (hasTsEslintPlugin) {
  rules['@typescript-eslint/no-explicit-any'] = 'warn';
  rules['@typescript-eslint/no-unused-vars'] = ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }];
}

if (hasReactHooksPlugin) {
  rules['react-hooks/set-state-in-effect'] = 'warn';
}

const files = hasTsParser ? ['**/*.{js,mjs,cjs,ts,tsx,jsx}'] : ['**/*.{js,mjs,cjs,jsx}'];

const baseConfig = [
  {
    files,
    rules,
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'scripts/**', '.backup/**'],
  },
];

let eslintConfig = baseConfig;

if (hasNextEslintConfig) {
  const nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
  const nextTs = (await import('eslint-config-next/typescript')).default;
  eslintConfig = [...nextVitals, ...nextTs, ...baseConfig];
}

export default eslintConfig;
