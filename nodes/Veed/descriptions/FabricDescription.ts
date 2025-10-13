import type { INodeProperties } from 'n8n-workflow';

export const fabricOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['fabric'],
			},
		},
		options: [
			{
				name: 'Generate Video',
				value: 'generateVideo',
				description: 'Generate a talking head video from image and audio',
				action: 'Generate a video using fabric model',
			},
		],
		default: 'generateVideo',
	},
];

export const fabricFields: INodeProperties[] = [
	// Model selection
	{
		displayName: 'Model Version',
		name: 'model',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		options: [
			{
				name: 'Fabric 1.0',
				value: 'veed/fabric-1.0',
				description: 'Higher quality, slower generation',
			},
			{
				name: 'Fabric 1.0 Fast',
				value: 'veed/fabric-1.0/fast',
				description: 'Faster generation, optimized for speed',
			},
		],
		default: 'veed/fabric-1.0',
		description: 'Select the Fabric model version',
	},

	// Image URL
	{
		displayName: 'Image URL',
		name: 'imageUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		default: '',
		placeholder: 'https://example.com/portrait.jpg',
		description: 'URL of the portrait image to use as the talking head base',
		hint: 'Best results with front-facing photos, clear facial features. Supported: JPG, PNG, WebP',
	},

	// Audio URL
	{
		displayName: 'Audio URL',
		name: 'audioUrl',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		default: '',
		placeholder: 'https://example.com/speech.mp3',
		description: 'URL of the audio file for lip sync',
		hint: 'Duration auto-detected from audio. Supported: MP3, WAV, M4A, AAC',
	},

	// Resolution
	{
		displayName: 'Resolution',
		name: 'resolution',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		options: [
			{
				name: '480p',
				value: '480p',
				description: 'Faster generation, lower quality',
			},
			{
				name: '720p',
				value: '720p',
				description: 'Slower generation, higher quality',
			},
		],
		default: '480p',
		description: 'Output video resolution',
	},

	// Aspect Ratio
	{
		displayName: 'Aspect Ratio',
		name: 'aspectRatio',
		type: 'options',
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		options: [
			{
				name: 'Landscape (16:9)',
				value: '16:9',
				description: 'Horizontal video (YouTube, presentations)',
			},
			{
				name: 'Portrait (9:16)',
				value: '9:16',
				description: 'Vertical video (TikTok, Instagram Stories)',
			},
			{
				name: 'Square (1:1)',
				value: '1:1',
				description: 'Square video (Instagram Feed)',
			},
		],
		default: '16:9',
		description: 'Output video aspect ratio',
	},

	// Advanced options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['fabric'],
				operation: ['generateVideo'],
			},
		},
		options: [
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingInterval',
				type: 'number',
				default: 5,
				description: 'Seconds between status checks',
				hint: 'Lower values = more frequent checks but more API calls. Recommended: 5 seconds',
				typeOptions: {
					minValue: 1,
					maxValue: 30,
					numberPrecision: 0,
				},
			},
			{
				displayName: 'Timeout (Minutes)',
				name: 'timeout',
				type: 'number',
				default: 10,
				description: 'Maximum wait time in minutes',
				hint: 'Recommended: 10+ minutes for longer videos, 15+ for 720p',
				typeOptions: {
					minValue: 1,
					maxValue: 60,
					numberPrecision: 0,
				},
			},
		],
	},
];
