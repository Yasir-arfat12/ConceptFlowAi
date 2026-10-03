import js from '@eslint/js';
import react from 'eslint-plugin-react';
import hooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
export default [
  js.configs.recommended,
  { files: ['src/**/*.{js,jsx}'], languageOptions: { globals: { ...globals.browser, ...globals.node }, parserOptions: { ecmaFeatures: { jsx: true } }, sourceType: 'module' },
    plugins: { react, 'react-hooks': hooks },
    settings: { react: { version: '18' } },
    rules: { 'react/jsx-uses-vars': 'error', 'react/jsx-uses-react': 'off', 'react/jsx-no-undef': 'error', 'no-undef': 'error', 'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }], 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'warn' } },
];
