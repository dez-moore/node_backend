const js = require('eslint-config-prettier');
const tseslint = require('typescript-eslint');

module.exports = [
    {
        ignores: ['node_modules/**', 'data/**'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'writable',
                process: 'readonly',
                __dirname: 'readonly',
                console: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                after: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
        },
    },
    {
        files: ['public/**/*.js'],
        languageOptions: {
            globals: {
                window: 'readonly',
                document: 'readonly',
                fetch: 'readonly',
                URLSearchParams: 'readonly',
                setTimeout: 'readonly',
                console: 'readonly',
            },
        },
    },
    ...tseslint.config({
        files: ['**/*.ts'],
        extends: [tseslint.configs.recommended],
        languageOptions: {
            sourceType: 'module',
        },
    }),
    js,
];
