import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { fabricFields, fabricOperations } from './descriptions';
import { fabric } from './operations';

export class Veed implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Veed',
		name: 'veed',
		icon: 'file:veed.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Veed AI services',
		defaults: {
			name: 'Veed',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'falAiApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['fabric'],
					},
				},
			},
		],
		properties: [
			// Resource selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Fabric',
						value: 'fabric',
						description: 'Generate talking head videos',
					},
				],
				default: 'fabric',
			},

			// Include fabric operations
			...fabricOperations,

			// Include fabric fields
			...fabricFields,
		],
		hints: [
			{
				message:
					'Video generation can take 5-15 minutes depending on length and resolution. The node will show progress updates during generation.',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'beforeExecution',
				displayCondition: '={{ $parameter["operation"] === "generateVideo" }}',
			},
			{
				message:
					'Using 480p resolution will generate videos faster than 720p. Consider using the Fast model variant for quicker iterations.',
				type: 'info',
				location: 'inputPane',
				whenToDisplay: 'always',
				displayCondition:
					'={{ $parameter["operation"] === "generateVideo" && $parameter["resolution"] === "720p" }}',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// Route to appropriate operation handler
		if (resource === 'fabric') {
			if (operation === 'generateVideo') {
				return await fabric.generateVideo.call(this);
			}
		}

		throw new NodeOperationError(
			this.getNode(),
			`The operation "${operation}" is not supported for resource "${resource}"`,
		);
	}
}
