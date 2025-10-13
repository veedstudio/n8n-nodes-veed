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
		apiKey: string;
	},
): Promise<FalSubmitResult> {
	const { model, imageUrl, audioUrl, resolution, aspectRatio, apiKey } = params;

	const response = await fetch(`${FAL_QUEUE_BASE_URL}/${model}`, {
		method: 'POST',
		headers: {
			Authorization: `Key ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			image_url: imageUrl,
			audio_url: audioUrl,
			resolution,
			aspect_ratio: aspectRatio,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new NodeOperationError(
			this.getNode(),
			`Failed to submit generation request: ${response.statusText}. ${errorText}`,
		);
	}

	const data = (await response.json()) as FalSubmitResult;
	this.logger.info(`Request submitted: ${data.request_id}, Queue position: ${data.queue_position}`);
	return data;
}

/**
 * Poll for completion of a Fabric video generation request
 */
export async function pollForCompletion(
	this: IExecuteFunctions,
	params: {
		statusUrl: string;
		apiKey: string;
		pollingInterval: number;
		timeout: number;
	},
): Promise<FalStatusResult> {
	const { statusUrl, apiKey, pollingInterval, timeout } = params;
	const startTime = Date.now();
	const maxRetries = 3;

	this.logger.info(`Polling status at: ${statusUrl}`);

	while (Date.now() - startTime < timeout) {
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				const response = await fetch(statusUrl, {
					headers: {
						Authorization: `Key ${apiKey}`,
					},
				});

				if (!response.ok) {
					throw new Error(`Status check failed: ${response.statusText}`);
				}

				const statusResult = (await response.json()) as FalStatusResult;

				if (statusResult.status === 'COMPLETED') {
					this.logger.info('Generation completed!');
					return statusResult;
				}

				if (statusResult.status === 'FAILED') {
					const errorMessage =
						statusResult.logs?.[statusResult.logs.length - 1]?.message || 'Unknown error';
					throw new NodeOperationError(this.getNode(), `Video generation failed: ${errorMessage}`);
				}

				// Extract and log progress if available
				if (statusResult.logs && statusResult.logs.length > 0) {
					const progress = extractProgress(statusResult.logs);
					if (progress !== null) {
						this.logger.info(`Generation progress: ${progress}%`);
					}
				}

				// Break retry loop on successful poll
				break;
			} catch (error) {
				attempt++;
				if (attempt >= maxRetries) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to check status after ${maxRetries} attempts: ${error.message}`,
					);
				}
				// Exponential backoff
				await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
			}
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, pollingInterval));
	}

	throw new NodeOperationError(
		this.getNode(),
		`Video generation timed out after ${timeout}ms. Try increasing the timeout in Options or use a lower resolution.`,
	);
}

/**
 * Fetch the final video result from response_url
 */
export async function fetchVideoResult(
	this: IExecuteFunctions,
	params: {
		responseUrl: string;
		apiKey: string;
	},
): Promise<FalVideoResult> {
	const { responseUrl, apiKey } = params;

	this.logger.info('Fetching video result...');

	const response = await fetch(responseUrl, {
		headers: {
			Authorization: `Key ${apiKey}`,
		},
	});

	if (!response.ok) {
		throw new NodeOperationError(
			this.getNode(),
			`Failed to fetch video result: ${response.statusText}`,
		);
	}

	const videoResult = (await response.json()) as FalVideoResult;

	if (!videoResult.video?.url) {
		throw new NodeOperationError(this.getNode(), 'Video result returned but no video URL found');
	}

	return videoResult;
}
