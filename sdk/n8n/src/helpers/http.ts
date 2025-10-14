import type { OptionsWithUri } from 'request';
import { NodeApiError } from 'n8n-workflow';

export const BASE_URL = 'https://xr2.uk';

export async function xr2Request(this: any, options: OptionsWithUri) {
    const requestOptions: OptionsWithUri = {
        method: 'POST',
        json: true,
        ...options,
    };

    try {
        // n8n injects credentials/auth headers automatically via credentials
        const response = await this.helpers.request(requestOptions);
        return response;
    } catch (error) {
        throw new NodeApiError(this.getNode(), error as object);
    }
}


