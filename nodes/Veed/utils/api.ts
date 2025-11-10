import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractProgress } from './progress';

/**
 * fal.ai API base URLs
 */
const FAL_QUEUE_BASE_URL = 'https://queue.fal.run';

/**
 * fal.ai request status types
 */
type FalStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

/**
 * Log entry from fal.ai API
 */
export interface FalLogEntry {
	message?: string;
	level?: string;
	timestamp?: string;
}

/**
 * Metrics from fal.ai API (performance and processing metrics)
 */
export interface FalMetrics {
	inference_time?: number;
	queue_time?: number;
	total_time?: number;
	[key: string]: number | string | boolean | undefined;
}

/**
 * Response from fal.ai queue submission
 */
interface FalSubmitResult {
	request_id: string;
	status_url: string;
	response_url: string;
	cancel_url?: string;
	status?: FalStatus;
	logs?: FalLogEntry[];
	metrics?: FalMetrics;
	queue_position?: number;
}

/**
 * Response from fal.ai status check
 */
interface FalStatusResult {
	status: FalStatus;
	request_id: string;
	response_url?: string;
	logs?: FalLogEntry[];
	metrics?: FalMetrics;
}

/**
 * Response from fal.ai video result endpoint
 */
interface FalVideoResult {
	video: {
		url: string;
		content_type: string;
		file_name?: string;
		file_size?: number;
		width?: number;
		height?: number;
	};
	request_id?: string;
}

/**
 * Submit a Fabric video generation request to fal.ai
 */
export async function submitFabricRequest(
	this: IExecuteFunctions,
	params: {
		model: string;
		imageUrl: string;
		audioUrl: string;
		resolution: string;
		aspectRatio: string;
	},
): Promise<FalSubmitResult> {
	const { model, imageUrl, audioUrl, resolution, aspectRatio } = params;

	try {
		const data = (await this.helpers.httpRequestWithAuthentication.call(this, 'falAiApi', {
			method: 'POST',
			url: `${FAL_QUEUE_BASE_URL}/${model}`,
			headers: {
				'Content-Type': 'application/json',
			},
			body: {
				image_url: imageUrl,
				audio_url: audioUrl,
				resolution,
				aspect_ratio: aspectRatio,
			},
			json: true,
		})) as FalSubmitResult;

		this.logger.info(
			`Request submitted: ${data.request_id}, Queue position: ${data.queue_position}`,
		);
		return data;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(
			this.getNode(),
			`Failed to submit generation request: ${errorMessage}`,
		);
	}
}

/**
 * Stream status updates for a Fabric video generation request using fal.ai's streaming endpoint
 * Reference: https://docs.fal.ai/model-apis/model-endpoints/queue#streaming-status
 */
export async function waitForCompletion(
	this: IExecuteFunctions,
	params: {
		statusUrl: string;
		timeout: number;
	},
): Promise<FalStatusResult> {
	const { statusUrl, timeout } = params;
	const startTime = Date.now();

	// Use the streaming endpoint with logs enabled
	const streamUrl = `${statusUrl}/stream?logs=1`;
	this.logger.info(`Streaming status from: ${streamUrl}`);

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'falAiApi', {
			method: 'GET',
			url: streamUrl,
			returnFullResponse: true,
		});

		if (!response.body) {
			throw new Error('Response body is null');
		}

		// Parse the response body as a string (SSE format)
		const bodyText =
			typeof response.body === 'string'
				? response.body
				: Buffer.isBuffer(response.body)
					? response.body.toString('utf-8')
					: JSON.stringify(response.body);

		const lines = bodyText.split('\n');

		for (const line of lines) {
			// Check timeout
			if (Date.now() - startTime > timeout) {
				throw new NodeOperationError(
					this.getNode(),
					`Video generation timed out after ${timeout}ms. Try increasing the timeout in Options or use a lower resolution.`,
				);
			}

			// SSE data lines start with "data: "
			if (line.startsWith('data: ')) {
				const data = line.slice(6); // Remove "data: " prefix

				if (data.trim() === '') {
					continue; // Skip empty data
				}

				try {
					const statusResult = JSON.parse(data) as FalStatusResult;

					// Log progress if available
					if (statusResult.logs && statusResult.logs.length > 0) {
						const progress = extractProgress(statusResult.logs);
						if (progress !== null) {
							this.logger.info(`Generation progress: ${progress}%`);
						}
					}

					// Check if completed
					if (statusResult.status === 'COMPLETED') {
						this.logger.info('Generation completed!');
						return statusResult;
					}

					// Check if failed
					if (statusResult.status === 'FAILED') {
						const errorMessage =
							statusResult.logs?.[statusResult.logs.length - 1]?.message || 'Unknown error';
						throw new NodeOperationError(
							this.getNode(),
							`Video generation failed: ${errorMessage}`,
						);
					}

					// Log current status
					this.logger.info(`Status: ${statusResult.status}`);
				} catch (parseError) {
					// If it's a NodeOperationError, rethrow it
					if (parseError instanceof NodeOperationError) {
						throw parseError;
					}
					// Skip invalid JSON lines (like ping events)
					continue;
				}
			}
		}

		throw new NodeOperationError(this.getNode(), 'Stream ended without completion status');
	} catch (error) {
		if (error instanceof NodeOperationError) {
			throw error;
		}
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(
			this.getNode(),
			`Failed to stream status updates: ${errorMessage}`,
		);
	}
}

/**
 * Fetch the final video result from response_url
 */
export async function fetchVideoResult(
	this: IExecuteFunctions,
	params: {
		responseUrl: string;
	},
): Promise<FalVideoResult> {
	const { responseUrl } = params;

	this.logger.info('Fetching video result...');

	try {
		const videoResult = (await this.helpers.httpRequestWithAuthentication.call(this, 'falAiApi', {
			method: 'GET',
			url: responseUrl,
			json: true,
		})) as FalVideoResult;

		if (!videoResult.video?.url) {
			throw new NodeOperationError(this.getNode(), 'Video result returned but no video URL found');
		}

		return videoResult;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new NodeOperationError(this.getNode(), `Failed to fetch video result: ${errorMessage}`);
	}
}
