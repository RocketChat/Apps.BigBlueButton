const eslintPluginPrettier = require('eslint-plugin-prettier');
const eslintPluginImport = require('eslint-plugin-import');
const eslintPluginTypeScript = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

module.exports = [
	{
		files: ['**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: './tsconfig.json',
				sourceType: 'module',
				ecmaVersion: 2018,
				warnOnUnsupportedTypeScriptVersion: false,
				ecmaFeatures: {
					experimentalObjectRestSpread: true,
					legacyDecorators: true,
				},
			},
		},
		plugins: {
			'prettier': eslintPluginPrettier,
			'import': eslintPluginImport,
			'@typescript-eslint': eslintPluginTypeScript,
		},
		rules: {
			'prettier/prettier': 'warn',
			'func-call-spacing': 'off',
			'jsx-quotes': ['error', 'prefer-single'],
			'indent': 'off',
			'no-dupe-class-members': 'error',
			'no-spaced-func': 'off',
			'no-unused-vars': 'off',
			'no-useless-constructor': 'off',
			'no-use-before-define': 'off',
			'@typescript-eslint/ban-ts-comment': [
				'error',
				{
					'ts-ignore': 'allow-with-description',
					'minimumDescriptionLength': 5,
				},
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: ['variable'],
					format: ['camelCase'],
					leadingUnderscore: 'allow',
				},
				{
					selector: 'typeLike',
					format: ['PascalCase'],
				},
			],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					ignoreRestSiblings: true,
				},
			],
			'@typescript-eslint/prefer-optional-chain': 'warn',
		},
	},
];
