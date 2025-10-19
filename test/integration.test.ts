import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { IExecuteFunctions } from 'n8n-workflow';
import { submitFabricRequest, waitForCompletion, fetchVideoResult } from '../nodes/Veed/utils/api';

/**
 * Helper to create a mock ReadableStream for SSE streaming
 */
function createMockSSEStream(events: Array<{ data: any }>) {
	const encoder = new TextEncoder();
	let eventIndex = 0;
	let closed = false;

	return new ReadableStream({
		pull(controller) {
			if (eventIndex < events.length) {
				const event = events[eventIndex++];
				const sseData = `data: ${JSON.stringify(event.data)}\n\n`;
				controller.enqueue(encoder.encode(sseData));

				// Close the stream after all events are sent
				if (eventIndex === events.length && !closed) {
					closed = true;
					// Use setTimeout to ensure the last event is processed before closing
					setTimeout(() => {
						try {
							controller.close();
						} catch (e) {
							// Ignore if already closed
						}
					}, 50);
				}
			}
		},
	});
}

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
		it('should submit request successfully and return full result', async () => {
			// Mock successful submit response
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					request_id: 'test_req_123',
					status_url: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123/status',
					response_url: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
					queue_position: 0,
				}),
			});

			const result = await submitFabricRequest.call(mockThis, {
				model: 'veed/fabric-1.0',
				imageUrl: 'https://example.com/portrait.jpg',
				audioUrl: 'https://example.com/speech.mp3',
				resolution: '480p',
				aspectRatio: '16:9',
				apiKey: 'test_key',
			});

			expect(result.request_id).toBe('test_req_123');
			expect(result.status_url).toBe(
				'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123/status',
			);
			expect(result.response_url).toBe(
				'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
			);
			expect(global.fetch).toHaveBeenCalledWith(
				'https://queue.fal.run/veed/fabric-1.0',
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
				json: async () => ({
					request_id: 'test_req_123',
					status_url: 'https://queue.fal.run/veed/fabric-1.0/fast/requests/test_req_123/status',
					response_url: 'https://queue.fal.run/veed/fabric-1.0/fast/requests/test_req_123',
					queue_position: 0,
				}),
			});

			await submitFabricRequest.call(mockThis, {
				model: 'veed/fabric-1.0/fast',
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
					model: 'veed/fabric-1.0',
					imageUrl: 'https://example.com/portrait.jpg',
					audioUrl: 'https://example.com/speech.mp3',
					resolution: '480p',
					aspectRatio: '16:9',
					apiKey: 'test_key',
				}),
			).rejects.toThrow('Failed to submit generation request');
		});
	});

	describe('waitForCompletion', () => {
		it('should stream until completion and return result', async () => {
			// Mock streaming sequence: IN_QUEUE -> IN_PROGRESS -> COMPLETED
			const stream = createMockSSEStream([
				{ data: { status: 'IN_QUEUE', logs: [] } },
				{ data: { status: 'IN_PROGRESS', logs: [{ message: 'Diffusing: 50%' }] } },
				{
					data: {
						status: 'COMPLETED',
						response_url: 'https://queue.fal.run/test/requests/test_req_123',
						logs: [{ message: 'Diffusing: 100%' }],
					},
				},
			]);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			const result = await waitForCompletion.call(mockThis, {
				statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
				apiKey: 'test_key',
				timeout: 10000,
			});

			expect(result.status).toBe('COMPLETED');
			expect(result.response_url).toBe('https://queue.fal.run/test/requests/test_req_123');

			// Should have called streaming endpoint
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/stream'),
				expect.any(Object),
			);
		});

		it('should throw error when generation fails', async () => {
			const stream = createMockSSEStream([
				{
					data: {
						status: 'FAILED',
						logs: [{ message: 'Generation failed: Invalid input' }],
					},
				},
			]);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					apiKey: 'test_key',
					timeout: 10000,
				}),
			).rejects.toThrow('Video generation failed');
		});

		it('should throw error with "Unknown error" when generation fails without logs', async () => {
			const stream = createMockSSEStream([
				{
					data: {
						status: 'FAILED',
						logs: [],
					},
				},
			]);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					apiKey: 'test_key',
					timeout: 10000,
				}),
			).rejects.toThrow('Video generation failed: Unknown error');
		});

		it('should throw error when timeout is exceeded', async () => {
			// Create a stream that never completes (keeps sending IN_PROGRESS)
			const encoder = new TextEncoder();
			const stream = new ReadableStream({
				async start(controller) {
					// Send IN_PROGRESS forever
					while (true) {
						const sseData = `data: ${JSON.stringify({ status: 'IN_PROGRESS', logs: [] })}\n\n`;
						controller.enqueue(encoder.encode(sseData));
						await new Promise((resolve) => setTimeout(resolve, 10));
					}
				},
			});

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					apiKey: 'test_key',
					timeout: 500,
				}),
			).rejects.toThrow('timed out');
		});

		it('should return complete status result when completed', async () => {
			const stream = createMockSSEStream([
				{
					data: {
						status: 'COMPLETED',
						response_url: 'https://queue.fal.run/test/requests/test_req_123',
						logs: [],
					},
				},
			]);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			const result = await waitForCompletion.call(mockThis, {
				statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
				apiKey: 'test_key',
				timeout: 10000,
			});

			expect(result).toEqual({
				status: 'COMPLETED',
				response_url: 'https://queue.fal.run/test/requests/test_req_123',
				logs: [],
			});
		});

		it('should extract and log progress during streaming', async () => {
			const stream = createMockSSEStream([
				{ data: { status: 'IN_PROGRESS', logs: [{ message: 'Diffusing: 25%' }] } },
				{ data: { status: 'IN_PROGRESS', logs: [{ message: 'Diffusing: 75%' }] } },
				{
					data: {
						status: 'COMPLETED',
						data: { video: { url: 'https://fal-cdn.com/result.mp4' } },
					},
				},
			]);

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				body: stream,
			});

			await waitForCompletion.call(mockThis, {
				statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
				apiKey: 'test_key',
				timeout: 10000,
			});

			// Should have logged progress updates
			expect(mockThis.logger.info).toHaveBeenCalledWith('Generation progress: 25%');
			expect(mockThis.logger.info).toHaveBeenCalledWith('Generation progress: 75%');
		});

		it('should throw error when stream connection fails', async () => {
			// Connection fails
			global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					apiKey: 'test_key',
					timeout: 10000,
				}),
			).rejects.toThrow('Failed to stream status updates');
		});

		it('should throw error when status stream API fails', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Internal Server Error',
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					apiKey: 'test_key',
					timeout: 10000,
				}),
			).rejects.toThrow('Failed to connect to status stream');
		});
	});

	describe('fetchVideoResult', () => {
		it('should successfully fetch video result with valid URL', async () => {
			const mockVideoResult = {
				video: {
					url: 'https://fal-cdn.com/result-video.mp4',
					content_type: 'video/mp4',
					file_name: 'result-video.mp4',
					file_size: 1024000,
					width: 1920,
					height: 1080,
				},
			};

			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => mockVideoResult,
			});

			const result = await fetchVideoResult.call(mockThis, {
				responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				apiKey: 'test_key',
			});

			expect(result).toEqual(mockVideoResult);
			expect(result.video.url).toBe('https://fal-cdn.com/result-video.mp4');
			expect(global.fetch).toHaveBeenCalledWith(
				'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				expect.objectContaining({
					headers: {
						Authorization: 'Key test_key',
					},
				}),
			);
		});

		it('should throw error when fetch fails with non-ok status', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				statusText: 'Not Found',
			});

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
					apiKey: 'test_key',
				}),
			).rejects.toThrow('Failed to fetch video result: Not Found');
		});

		it('should throw error when video URL is missing from response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					video: {},
				}),
			});

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
					apiKey: 'test_key',
				}),
			).rejects.toThrow('Video result returned but no video URL found');
		});

		it('should throw error when video object is missing from response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					status: 'COMPLETED',
				}),
			});

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
					apiKey: 'test_key',
				}),
			).rejects.toThrow('Video result returned but no video URL found');
		});

		it('should log info message when fetching video result', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					video: {
						url: 'https://fal-cdn.com/result-video.mp4',
					},
				}),
			});

			await fetchVideoResult.call(mockThis, {
				responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				apiKey: 'test_key',
			});

			expect(mockThis.logger.info).toHaveBeenCalledWith('Fetching video result...');
		});
	});
});
