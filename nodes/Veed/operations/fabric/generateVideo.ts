import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { validateUrl } from '../../utils/validators';
import { submitFabricRequest, waitForCompletion, fetchVideoResult } from '../../utils/api';

/**
 * Generate a talking head video using Fabric model
 */
export async function generateVideo(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	const items = this.getInputData();
	const returnData: INodeExecutionData[] = [];
	const credentials = await this.getCredentials('falAiApi');
	const apiKey = credentials.apiKey as string;

	for (let i = 0; i < items.length; i++) {
		try {
			// Get parameters
			const model = this.getNodeParameter('model', i) as string;
			const imageUrl = this.getNodeParameter('imageUrl', i) as string;
			const audioUrl = this.getNodeParameter('audioUrl', i) as string;
			const resolution = this.getNodeParameter('resolution', i) as string;
			const aspectRatio = this.getNodeParameter('aspectRatio', i) as string;
			const options = this.getNodeParameter('options', i, {}) as {
				timeout?: number;
			};

			// Validate inputs
			validateUrl(imageUrl, 'Image URL');
			validateUrl(audioUrl, 'Audio URL');

			// Convert user-friendly units to milliseconds
			const timeoutMs = (options.timeout || 10) * 60 * 1000; // minutes to ms
			const startTime = Date.now();

			const submitResult = await submitFabricRequest.call(this, {
				model,
				imageUrl,
				audioUrl,
				resolution,
				aspectRatio,
				apiKey,
			});

			this.logger.info(
				`Fabric generation request submitted: ${submitResult.request_id} (Queue position: ${submitResult.queue_position})`,
			);

			const statusResult = await waitForCompletion.call(this, {
				statusUrl: submitResult.status_url,
				apiKey,
				timeout: timeoutMs,
			});

			if (!submitResult.response_url || !statusResult.response_url) {
				throw new Error('Response URL not available');
			}

			const videoResult = await fetchVideoResult.call(this, {
				responseUrl: submitResult.response_url || statusResult.response_url,
				apiKey,
			});

			const duration = Date.now() - startTime;

			const result = {
				video: videoResult.video,
				requestId: submitResult.request_id,
				status: statusResult.status,
				duration,
			};

			returnData.push({
				json: result,
				pairedItem: { item: i },
			});
		} catch (error) {
			if (this.continueOnFail()) {
				returnData.push({
					json: { error: error.message },
					pairedItem: { item: i },
				});
			} else {
				throw error;
			}
		}
	}

	return [returnData];
}
