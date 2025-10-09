import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { validateImageUrl, validateAudioUrl } from '../../utils/validators';
import { submitFabricRequest, pollForCompletion } from '../../utils/api';

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
				pollingInterval?: number;
				timeout?: number;
			};

			// Validate inputs
			validateImageUrl(imageUrl);
			validateAudioUrl(audioUrl);

			// Convert user-friendly units to milliseconds
			const pollingIntervalMs = (options.pollingInterval || 5) * 1000; // seconds to ms
			const timeoutMs = (options.timeout || 10) * 60 * 1000; // minutes to ms

			// Submit generation request
			const requestId = await submitFabricRequest.call(this, {
				model,
				imageUrl,
				audioUrl,
				resolution,
				aspectRatio,
				apiKey,
			});

			this.logger.info(`Fabric generation request submitted: ${requestId}`);

			// Poll for completion
			const result = await pollForCompletion.call(this, {
				requestId,
				model,
				apiKey,
				pollingInterval: pollingIntervalMs,
				timeout: timeoutMs,
			});

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
