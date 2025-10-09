import { describe, it, expect } from 'vitest';
import { extractProgress } from '../../../../nodes/Veed/utils/progress';

describe('Progress Extraction', () => {
	it('should return null for empty logs', () => {
		expect(extractProgress([])).toBeNull();
	});

	it('should return null for undefined logs', () => {
		// @ts-expect-error - Testing invalid input
		expect(extractProgress(undefined)).toBeNull();
	});

	it('should return null for logs without progress message', () => {
		const logs = [{ message: 'Starting generation' }, { message: 'Processing...' }];
		expect(extractProgress(logs)).toBeNull();
	});

	it('should extract progress from "Diffusing: 45%" message', () => {
		const logs = [{ message: 'Starting generation' }, { message: 'Diffusing: 45%' }];
		expect(extractProgress(logs)).toBe(45);
	});

	it('should extract progress from last message only', () => {
		const logs = [
			{ message: 'Diffusing: 20%' },
			{ message: 'Diffusing: 50%' },
			{ message: 'Diffusing: 75%' },
		];
		expect(extractProgress(logs)).toBe(75);
	});

	it('should handle 0% progress', () => {
		const logs = [{ message: 'Diffusing: 0%' }];
		expect(extractProgress(logs)).toBe(0);
	});

	it('should handle 100% progress', () => {
		const logs = [{ message: 'Diffusing: 100%' }];
		expect(extractProgress(logs)).toBe(100);
	});

	it('should return null for invalid progress format', () => {
		const logs = [{ message: 'Progress: 45' }]; // Missing "Diffusing:" and "%"
		expect(extractProgress(logs)).toBeNull();
	});

	it('should handle logs with no message property', () => {
		const logs = [{ text: 'Some text' }];
		// @ts-expect-error - Testing invalid input
		expect(extractProgress(logs)).toBeNull();
	});
});
