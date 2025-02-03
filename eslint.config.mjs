import eslint from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import reactCompiler from 'eslint-plugin-react-compiler';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import functional from 'eslint-plugin-functional';

export default [
    // Configuration for `src/client/**/*`
    {
        files: ['src/client/**/*.{js,jsx,ts,tsx}'],
        ignores: [
            "src/client/types.d.ts",
            "src/client/types_easyButton.d.ts",
            "src/client/vite.config.js",
            "src/client/postcss.config.js"
        ],
        settings: {
            react: { version: '19' },
            'import/resolver': {
                alias: {
                    map: [['', './httpdocs']],
                },
                typescript: true,
                node: true,
            },
        },
        languageOptions: {
            ecmaVersion: 2023,
            parser: tsParser,
            parserOptions: {
                project: './src/client/tsconfig.json',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'react-compiler': reactCompiler,
            functional,
            '@typescript-eslint': ts,
            ts,
            "import": importPlugin,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react-compiler/react-compiler': 'error',
            'no-else-return': 'error',
            '@/no-unused-vars': [
                'warn',
                {
                    destructuredArrayIgnorePattern: '^_',
                    ignoreRestSiblings: true,
                },
            ],
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            'import/first': 'error',
            'import/newline-after-import': 'warn',
            'import/no-duplicates': 'error',
            '@/no-empty-function': ['off'],
            curly: ['error', 'all'],
        },
    },

    // Configuration for everything outside `src/client/**/*`
    {
        files: ['/**/*.{js,jsx,ts,tsx}'],
        "ignorePatterns": [
            "src/client/**/*",
            "src/tests/",
            "./scripts/",
            "./init/",
            "*.d.ts"
        ],

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tsParser,
            parserOptions: {
                project: 'tsconfig.json',
            },
        },
        plugins: {
            tseslint: tseslint,
            functional,
            '@typescript-eslint': ts,
            ts,
            "import": importPlugin,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            ...tseslint.configs.recommendedTypeChecked.rules,
        },
    },
];
