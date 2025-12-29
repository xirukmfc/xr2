import { IAuthenticateGeneric, ICredentialType, INodeProperties } from 'n8n-workflow';

export class XR2Api implements ICredentialType {
    name = 'xr2Api';
    displayName = 'xR2 API';
    documentationUrl = 'https://github.com/channeler-ai/xr2';
    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            default: '',
            description: 'Product API key for xR2 (starts with xr2_prod_)',
        },
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://xr2.uk',
            description: 'API base URL (use http://localhost:8000 for local development)',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '={{"Bearer " + $credentials.apiKey}}',
            },
        },
    };
}


