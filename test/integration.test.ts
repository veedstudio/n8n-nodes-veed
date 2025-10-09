import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IExecuteFunctions } from 'n8n-workflow';
import { submitFabricRequest, pollForCompletion } from '../nodes/Veed/utils/api';

/**
 * Integration tests for Veed Fabric API integration
 */

describe('Fabric API Integration (Mocked)', () => {
	const mockThis = {
		getNode: () => ({ name: 'Veed' }),
		logger: {
			info: vi.fn(),
			error: vi.fn(),
		},
	} as unknown as IExecuteFunctions;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('submitFabricRequest', () => {
		it('should submit request successfully and return request_id', async () => {
			// Mock successful submit response
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ request_id: 'test_req_123' }),
			});

			const requestId = await submitFabricRequest.call(mockThis, {
				model: 'fal-ai/veed/fabric-1.0',
				imageUrl: 'https://example.com/portrait.jpg',
				audioUrl: 'https://example.com/speech.mp3',
				resolution: '480p',
				aspectRatio: '16:9',
				apiKey: 'test_key',
			});

			expect(requestId).toBe('test_req_123');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://fal.run/fal-ai/veed/fabric-1.0',
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: 'Key test_key',
					}),
				}),
			);
		});

		it('should send correct request body parameters', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ request_id: 'test_req_123' }),
			});

			await submitFabricRequest.call(mockThis, {
				model: 'fal-ai/veed/fabric-1.0/fast',
				imageUrl: 'https://example.com/portrait.jpg',
				audioUrl: 'https://example.com/speech.mp3',
				resolution: '720p',
				aspectRatio: '9:16',
				apiKey: 'test_key',
			});

			const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
			const requestBody = JSON.parse(fetchCall[1].body as string);

			expect(requestBody).toEqual({
				image_url: 'https://example.com/portrait.jpg',
				audio_url: 'https://example.com/speech.mp3',
				resolution: '720p',
				aspect_ratio: '9:16',
			});
		});

		it('should throw error on API failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Bad Request',
				text: async () => 'Invalid parameters',
			});

			await expect(
				submitFabricRequest.call(mockThis, {
					model: 'fal-ai/veed/fabric-1.0',
					imageUrl: 'https://example.com/portrait.jpg',
					audioUrl: 'https://example.com/speech.mp3',
					resolution: '480p',
					aspectRatio: '16:9',
					apiKey: 'test_key',
				}),
			).rejects.toThrow('Failed to submit generation request');
		});
	});

	describe('pollForCompletion', () => {
		it('should poll until completion and return result', async () => {
			// Mock polling sequence: IN_QUEUE -> IN_PROGRESS -> COMPLETED
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'IN_QUEUE',
						logs: [],
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'IN_PROGRESS',
						logs: [{ message: 'Diffusing: 50%' }],
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'COMPLETED',
						data: {
							video: {
								url: 'https://fal-cdn.com/result.mp4',
							},
						},
						logs: [{ message: 'Diffusing: 100%' }],
					}),
				});

			const result = await pollForCompletion.call(mockThis, {
				requestId: 'test_req_123',
				model: 'fal-ai/veed/fabric-1.0',
				apiKey: 'test_key',
				pollingInterval: 100,
				timeout: 10000,
			});

			expect(result.status).toBe('completed');
			expect(result.videoUrl).toBe('https://fal-cdn.com/result.mp4');
			expect(result.requestId).toBe('test_req_123');
			expect(result.duration).toBeGreaterThan(0);

			// Should have polled 3 times
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it('should throw error when generation fails', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 'FAILED',
					logs: [{ message: 'Generation failed: Invalid input' }],
				}),
			});

			await expect(
				pollForCompletion.call(mockThis, {
					requestId: 'test_req_123',
					model: 'fal-ai/veed/fabric-1.0',
					apiKey: 'test_key',
					pollingInterval: 100,
					timeout: 10000,
				}),
			).rejects.toThrow('Video generation failed');
		});

		it('should throw error when timeout is exceeded', async () => {
			// Mock always returns IN_PROGRESS
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 'IN_PROGRESS',
					logs: [],
				}),
			});

			await expect(
				pollForCompletion.call(mockThis, {
					requestId: 'test_req_123',
					model: 'fal-ai/veed/fabric-1.0',
					apiKey: 'test_key',
					pollingInterval: 100,
					timeout: 500,
				}),
			).rejects.toThrow('timed out');
		});

		it('should handle missing video URL in completed response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 'COMPLETED',
					data: {}, // No video object
					logs: [],
				}),
			});

			await expect(
				pollForCompletion.call(mockThis, {
					requestId: 'test_req_123',
					model: 'fal-ai/veed/fabric-1.0',
					apiKey: 'test_key',
					pollingInterval: 100,
					timeout: 10000,
				}),
			).rejects.toThrow('no video URL was returned');
		});

		it('should extract and log progress during polling', async () => {
			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'IN_PROGRESS',
						logs: [{ message: 'Diffusing: 25%' }],
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'IN_PROGRESS',
						logs: [{ message: 'Diffusing: 75%' }],
					}),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'COMPLETED',
						data: { video: { url: 'https://fal-cdn.com/result.mp4' } },
					}),
				});

			await pollForCompletion.call(mockThis, {
				requestId: 'test_req_123',
				model: 'fal-ai/veed/fabric-1.0',
				apiKey: 'test_key',
				pollingInterval: 100,
				timeout: 10000,
			});

			// Should have logged progress updates
			expect(mockThis.logger.info).toHaveBeenCalledWith('Generation progress: 25%');
			expect(mockThis.logger.info).toHaveBeenCalledWith('Generation progress: 75%');
		});

		it('should retry on transient network errors', async () => {
			// First attempt fails, second succeeds
			global.fetch = vi
				.fn()
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						status: 'COMPLETED',
						data: { video: { url: 'https://fal-cdn.com/result.mp4' } },
					}),
				});

			const result = await pollForCompletion.call(mockThis, {
				requestId: 'test_req_123',
				model: 'fal-ai/veed/fabric-1.0',
				apiKey: 'test_key',
				pollingInterval: 100,
				timeout: 10000,
			});

			expect(result.videoUrl).toBe('https://fal-cdn.com/result.mp4');
			expect(global.fetch).toHaveBeenCalledTimes(2); // Failed once, succeeded once
		});

		it('should fail after max retries', async () => {
			// Always fails
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			await expect(
				pollForCompletion.call(mockThis, {
					requestId: 'test_req_123',
					model: 'fal-ai/veed/fabric-1.0',
					apiKey: 'test_key',
					pollingInterval: 100,
					timeout: 10000,
				}),
			).rejects.toThrow('Failed to check status after 3 attempts');
		});

		it('should throw error when status check API fails', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
			});

			await expect(
				pollForCompletion.call(mockThis, {
					requestId: 'test_req_123',
					model: 'fal-ai/veed/fabric-1.0',
					apiKey: 'test_key',
					pollingInterval: 100,
					timeout: 10000,
				}),
			).rejects.toThrow('Status check failed: Internal Server Error');
		});
	});
});
