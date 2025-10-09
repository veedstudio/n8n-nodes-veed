import type { IExecuteFunctions, IDataObject } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { extractProgress } from './progress';

/**
 * fal.ai API base URLs
 */
const FAL_QUEUE_BASE_URL = 'https://queue.fal.run';

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
): Promise<string> {
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

	const data = (await response.json()) as { request_id: string };
	return data.request_id;
}

/**
 * Poll for completion of a Fabric video generation request
 */
export async function pollForCompletion(
	this: IExecuteFunctions,
	params: {
		requestId: string;
		model: string;
		apiKey: string;
		pollingInterval: number;
		timeout: number;
	},
): Promise<IDataObject> {
	const { requestId, model, apiKey, pollingInterval, timeout } = params;
	const startTime = Date.now();
	const maxRetries = 3;

	while (Date.now() - startTime < timeout) {
		let attempt = 0;

		while (attempt < maxRetries) {
			try {
				const response = await fetch(
					`${FAL_QUEUE_BASE_URL}/${model}/requests/${requestId}/status`,
					{
						headers: {
							Authorization: `Key ${apiKey}`,
						},
					},
				);

				if (!response.ok) {
					throw new Error(`Status check failed: ${response.statusText}`);
				}

				const result = (await response.json()) as {
					status: string;
					data?: { video: { url: string } };
					logs?: Array<{ message: string }>;
				};
				const { status, data, logs } = result;

				if (status === 'COMPLETED') {
					if (!data?.video?.url) {
						throw new NodeOperationError(
							this.getNode(),
							'Video generation completed but no video URL was returned',
						);
					}
					return {
						requestId,
						status: 'completed',
						videoUrl: data.video.url,
						duration: Date.now() - startTime,
					};
				}

				if (status === 'FAILED') {
					const errorMessage = logs?.[logs.length - 1]?.message || 'Unknown error';
					throw new NodeOperationError(this.getNode(), `Video generation failed: ${errorMessage}`);
				}

				// Extract and log progress
				if (logs && logs.length > 0) {
					const progress = extractProgress(logs);
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
