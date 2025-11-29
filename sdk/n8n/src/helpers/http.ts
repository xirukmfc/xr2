import { NodeApiError, IDataObject, JsonObject } from 'n8n-workflow';

export const BASE_URL = 'https://xr2.uk';

export interface RequestOptions {
    uri: string;
    body?: IDataObject;
    method?: string;
    json?: boolean;
}

export async function xr2Request(this: any, options: RequestOptions) {
    const requestOptions = {
        method: 'POST',
        json: true,
        ...options,
    };

    try {
        // Use requestWithAuthentication to automatically inject credentials
        const response = await this.helpers.requestWithAuthentication.call(
            this,
            'xr2Api',
            requestOptions,
        );
        return response;
    } catch (error: any) {

        // Extract status code from various possible locations
        const statusCode = error.statusCode || error.status || error.httpCode ||
                          error.response?.statusCode || error.response?.status;

        // Extract error details from response
        let apiDetails = '';
        if (error.response?.body) {
            const body = typeof error.response.body === 'string'
                ? error.response.body
                : JSON.stringify(error.response.body, null, 2);
            apiDetails = body;
        } else if (error.cause?.response?.body) {
            apiDetails = JSON.stringify(error.cause.response.body, null, 2);
        }

        // Enhance error messages based on status code
        let errorMessage = '';
        let suggestions = '';

        if (statusCode === 401 || statusCode === 403) {
            errorMessage = '🔐 Authentication Failed';
            suggestions = 'Please verify:\n' +
                '✓ Your API key is correct in n8n credentials\n' +
                '✓ The API key starts with "xr2_prod_"\n' +
                '✓ The API key is active in your xR2 account';
        } else if (statusCode === 404) {
            errorMessage = '❌ Prompt Not Found';
            suggestions = 'Please check:\n' +
                '✓ The prompt slug is correct (no typos)\n' +
                '✓ The prompt exists in your xR2 dashboard\n' +
                '✓ The prompt has at least one published version\n' +
                '✓ You have access to this prompt in your workspace\n\n' +
                '💡 Tip: Available prompts can be viewed at https://xr2.uk/prompts';
        } else if (statusCode === 429) {
            errorMessage = '⏱️ Rate Limit Exceeded';
            suggestions = 'Too many requests. Please wait a moment and try again.';
        } else if (statusCode && statusCode >= 500) {
            errorMessage = '🔧 Server Error';
            suggestions = 'xR2 server is experiencing issues. Please try again in a few moments.\n' +
                'If the problem persists, contact support at https://xr2.uk/support';
        } else {
            errorMessage = '⚠️ Request Failed';
            suggestions = error.message || 'An unexpected error occurred';
        }

        // Combine message with details
        let fullMessage = `${errorMessage}\n\n${suggestions}`;

        if (apiDetails) {
            fullMessage += `\n\n📋 API Response:\n${apiDetails}`;
        }

        if (statusCode) {
            fullMessage += `\n\n🔍 HTTP Status: ${statusCode}`;
        }

        // Create enhanced error object
        const enhancedError = {
            ...error,
            message: fullMessage,
            httpCode: statusCode || 'unknown',
            description: fullMessage,
            statusCode: statusCode,
        };

        throw new NodeApiError(this.getNode(), enhancedError as JsonObject);
    }
}


