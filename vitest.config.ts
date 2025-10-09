import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: [
				'node_modules/',
				'dist/',
				'test/',
				'coverage/',
				'**/*.test.ts',
				'**/*.config.*',
				'**/.prettierrc.*',
				'**/index.ts', // Re-export files
				'**/credentials/**', // n8n credential definitions
				'**/descriptions/**', // n8n node descriptions (metadata)
				'**/operations/**', // n8n operation wrappers
				'**/*.node.ts', // n8n node files (integration tested separately)
			],
		},
		include: ['**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
	},
});
