import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		ignores: ['test/**', 'vitest.config.ts'],
	},
];
