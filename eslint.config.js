import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';

export default [
    { ignores: ['public/**', 'node_modules/**', 'vendor/**', 'bootstrap/ssr/**'] },
    js.configs.recommended,
    {
        files: ['resources/js/**/*.{js,jsx}'],
        plugins: { react, 'react-hooks': reactHooks, 'unused-imports': unusedImports },
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2021,
                // Laravel/Ziggy + app globals
                route: 'readonly',
                Ziggy: 'readonly',
                axios: 'readonly',
            },
        },
        settings: { react: { version: '19' } },
        rules: {
            ...react.configs.flat.recommended.rules,
            // Classic hooks rules only — the new react-compiler rules in
            // eslint-plugin-react-hooks v7 are not applicable to this codebase.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            // Opinionated/cosmetic on a legacy tree — surface as warnings, don't block.
            // unused-imports auto-removes dead imports on --fix; core rule off to avoid overlap.
            'no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'warn',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                    caughtErrors: 'none',
                },
            ],
            // Keep stray debug logging out of the tree; warn/error are allowed.
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'react/no-unescaped-entities': 'warn',
            'react/no-children-prop': 'warn',
            'react/display-name': 'warn',
            'no-prototype-builtins': 'warn',
            'no-empty': 'warn',
        },
    },
    prettier,
];
