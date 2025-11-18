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
	const mockHttpRequestWithAuthentication = vi.fn();
	const mockThis = {
		getNode: () => ({ name: 'Veed' }),
		logger: {
			info: vi.fn(),
			error: vi.fn(),
		},
		helpers: {
			httpRequestWithAuthentication: mockHttpRequestWithAuthentication,
		},
	} as unknown as IExecuteFunctions;

	beforeEach(() => {
		vi.clearAllMocks();
		mockHttpRequestWithAuthentication.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('submitFabricRequest', () => {
		it('should submit request successfully and return full result', async () => {
			// Mock successful submit response
			mockHttpRequestWithAuthentication.mockResolvedValue({
				request_id: 'test_req_123',
				status_url: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123/status',
				response_url: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				queue_position: 0,
			});

			const result = await submitFabricRequest.call(mockThis, {
				model: 'veed/fabric-1.0',
				imageUrl: 'https://example.com/portrait.jpg',
				audioUrl: 'https://example.com/speech.mp3',
				resolution: '480p',
				aspectRatio: '16:9',
			});

			expect(result.request_id).toBe('test_req_123');
			expect(result.status_url).toBe(
				'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123/status',
			);
			expect(result.response_url).toBe(
				'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
			);
			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'falAiApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://queue.fal.run/veed/fabric-1.0',
					body: expect.objectContaining({
						image_url: 'https://example.com/portrait.jpg',
						audio_url: 'https://example.com/speech.mp3',
					}),
				}),
			);
		});

		it('should send correct request body parameters', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				request_id: 'test_req_123',
				status_url: 'https://queue.fal.run/veed/fabric-1.0/fast/requests/test_req_123/status',
				response_url: 'https://queue.fal.run/veed/fabric-1.0/fast/requests/test_req_123',
				queue_position: 0,
			});

			await submitFabricRequest.call(mockThis, {
				model: 'veed/fabric-1.0/fast',
				imageUrl: 'https://example.com/portrait.jpg',
				audioUrl: 'https://example.com/speech.mp3',
				resolution: '720p',
				aspectRatio: '9:16',
			});

			const call = mockHttpRequestWithAuthentication.mock.calls[0];
			const requestOptions = call[1];

			expect(requestOptions.body).toEqual({
				image_url: 'https://example.com/portrait.jpg',
				audio_url: 'https://example.com/speech.mp3',
				resolution: '720p',
				aspect_ratio: '9:16',
			});
		});

		it('should throw error on API failure', async () => {
			mockHttpRequestWithAuthentication.mockRejectedValue(new Error('Bad Request'));

			await expect(
				submitFabricRequest.call(mockThis, {
					model: 'veed/fabric-1.0',
					imageUrl: 'https://example.com/portrait.jpg',
					audioUrl: 'https://example.com/speech.mp3',
					resolution: '480p',
					aspectRatio: '16:9',
				}),
			).rejects.toThrow('Failed to submit generation request');
		});
	});

	describe('waitForCompletion', () => {
		it('should stream until completion and return result', async () => {
			// Mock SSE response with multiple status updates
			const sseBody = `data: {"status":"IN_QUEUE","logs":[]}\n\ndata: {"status":"IN_PROGRESS","logs":[{"message":"Diffusing: 50%"}]}\n\ndata: {"status":"COMPLETED","response_url":"https://queue.fal.run/test/requests/test_req_123","logs":[{"message":"Diffusing: 100%"}]}\n\n`;

			mockHttpRequestWithAuthentication.mockResolvedValue({
				body: sseBody,
			});

			const result = await waitForCompletion.call(mockThis, {
				statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
				timeout: 10000,
			});

			expect(result.status).toBe('COMPLETED');
			expect(result.response_url).toBe('https://queue.fal.run/test/requests/test_req_123');

			// Should have called streaming endpoint
			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'falAiApi',
				expect.objectContaining({
					url: expect.stringContaining('/stream'),
				}),
			);
		});

		it('should throw error when generation fails', async () => {
			const sseBody = `data: {"status":"FAILED","logs":[{"message":"Generation failed: Invalid input"}]}\n\n`;

			mockHttpRequestWithAuthentication.mockResolvedValue({
				body: sseBody,
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					timeout: 10000,
				}),
			).rejects.toThrow('Video generation failed');
		});

		it('should throw error with "Unknown error" when generation fails without logs', async () => {
			const sseBody = `data: {"status":"FAILED","logs":[]}\n\n`;

			mockHttpRequestWithAuthentication.mockResolvedValue({
				body: sseBody,
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					timeout: 10000,
				}),
			).rejects.toThrow('Video generation failed: Unknown error');
		});

		it('should throw error when timeout is exceeded', async () => {
			// Mock a response that takes longer than the timeout
			// Create many IN_PROGRESS events to simulate slow processing
			let sseBody = '';
			for (let i = 0; i < 1000; i++) {
				sseBody += `data: {"status":"IN_PROGRESS","logs":[]}\n\n`;
			}

			mockHttpRequestWithAuthentication.mockImplementation(async () => {
				// Simulate delay
				await new Promise((resolve) => setTimeout(resolve, 600));
				return { body: sseBody };
			});

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					timeout: 500,
				}),
			).rejects.toThrow('timed out');
		});

		it('should return complete status result when completed', async () => {
			const sseBody = `data: {"status":"COMPLETED","response_url":"https://queue.fal.run/test/requests/test_req_123","logs":[]}\n\n`;

			mockHttpRequestWithAuthentication.mockResolvedValue({
				body: sseBody,
			});

			const result = await waitForCompletion.call(mockThis, {
				statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
				timeout: 10000,
			});

			expect(result).toEqual({
				status: 'COMPLETED',
				response_url: 'https://queue.fal.run/test/requests/test_req_123',
				logs: [],
			});
		});

		it('should throw error when stream connection fails', async () => {
			// Connection fails
			mockHttpRequestWithAuthentication.mockRejectedValue(new Error('Network error'));

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					timeout: 10000,
				}),
			).rejects.toThrow('Failed to stream status updates');
		});

		it('should throw error when status stream API fails', async () => {
			mockHttpRequestWithAuthentication.mockRejectedValue(new Error('Internal Server Error'));

			await expect(
				waitForCompletion.call(mockThis, {
					statusUrl: 'https://queue.fal.run/test/requests/test_req_123/status',
					timeout: 10000,
				}),
			).rejects.toThrow('Failed to stream status updates');
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

			mockHttpRequestWithAuthentication.mockResolvedValue(mockVideoResult);

			const result = await fetchVideoResult.call(mockThis, {
				responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
			});

			expect(result).toEqual(mockVideoResult);
			expect(result.video.url).toBe('https://fal-cdn.com/result-video.mp4');
			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'falAiApi',
				expect.objectContaining({
					url: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				}),
			);
		});

		it('should throw error when fetch fails with non-ok status', async () => {
			mockHttpRequestWithAuthentication.mockRejectedValue(new Error('Not Found'));

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				}),
			).rejects.toThrow('Failed to fetch video result');
		});

		it('should throw error when video URL is missing from response', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				video: {},
			});

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				}),
			).rejects.toThrow('Video result returned but no video URL found');
		});

		it('should throw error when video object is missing from response', async () => {
			mockHttpRequestWithAuthentication.mockResolvedValue({
				status: 'COMPLETED',
			});

			await expect(
				fetchVideoResult.call(mockThis, {
					responseUrl: 'https://queue.fal.run/veed/fabric-1.0/requests/test_req_123',
				}),
			).rejects.toThrow('Video result returned but no video URL found');
		});
	});
});
