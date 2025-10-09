import type { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class FalAiApi implements ICredentialType {
	name = 'falAiApi';

	displayName = 'Fal.ai API';

	documentationUrl = 'https://docs.fal.ai/authentication/key-based';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'fal_****',
			description:
				'Your personal fal.ai API key. Get it from <a href="https://fal.ai/dashboard/keys" target="_blank">fal.ai dashboard</a>',
		},
	];

	// Authentication method for HTTP requests
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Key {{$credentials.apiKey}}',
			},
		},
	};
}
