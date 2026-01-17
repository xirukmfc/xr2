"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XR2Api = void 0;
class XR2Api {
    constructor() {
        this.name = 'xr2Api';
        this.displayName = 'xR2 API';
        this.documentationUrl = 'https://github.com/channeler-ai/xr2';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{"Bearer " + $credentials.apiKey}}',
                },
            },
        };
    }
}
exports.XR2Api = XR2Api;
