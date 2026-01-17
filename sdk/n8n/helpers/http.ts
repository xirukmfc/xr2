import { NodeApiError, IDataObject, JsonObject } from 'n8n-workflow';

export const BASE_URL = 'https://xr2.uk';

export interface RequestOptions {
    url: string;
    body?: IDataObject;
    method?: string;
    json?: boolean;
}

function handleXr2Error(this: any, error: any): never {
    // Extract status code from various possible locations
    const rawStatusCode = error.httpCode || error.statusCode || error.status ||
                         error.response?.statusCode || error.response?.status;
    const statusCode = rawStatusCode !== undefined && rawStatusCode !== null
        ? Number(rawStatusCode)
        : undefined;
    const statusForMessage = Number.isFinite(statusCode) ? statusCode : rawStatusCode;

    // Extract error details from response body - check multiple locations
    let apiResponse: any = null;

    // n8n puts the response in error.errorResponse
    const possibleBodies = [
        error.errorResponse,
        error.response?.body,
        error.cause?.response?.body,
        error.body,
        error.data,
    ];

    for (const body of possibleBodies) {
        if (body) {
            try {
                apiResponse = typeof body === 'string' ? JSON.parse(body) : body;
                break;
            } catch {
                // continue to next
            }
        }
    }

    // Extract detailed error message from API response
    let apiErrorMessage = '';
    let apiSuggestion = '';

    if (apiResponse?.detail) {
        const detail = apiResponse.detail;
        if (typeof detail === 'object') {
            apiErrorMessage = detail.message || detail.error || '';
            apiSuggestion = detail.suggestion || '';
            if (detail.available_statuses) {
                apiSuggestion += `\nAvailable statuses: ${detail.available_statuses.join(', ')}`;
            }
            if (detail.slug) {
                apiErrorMessage = `[${detail.slug}] ${apiErrorMessage}`;
            }
        } else {
            apiErrorMessage = String(detail);
        }
    }

    // Build error message
    let errorMessage = '';
    let suggestions = '';

    if (statusCode === 401 || statusCode === 403) {
        errorMessage = '🔐 Authentication Failed';
        suggestions = apiErrorMessage || 'Please verify:\n' +
            '✓ Your API key is correct in n8n credentials\n' +
            '✓ The API key starts with "xr2_prod_"\n' +
            '✓ The API key is active in your xR2 account';
    } else if (statusCode === 404) {
        errorMessage = '❌ ' + (apiErrorMessage || 'Resource Not Found');
        suggestions = apiSuggestion || 'Please check:\n' +
            '✓ The prompt slug is correct (no typos)\n' +
            '✓ The prompt has a deployed (production) version\n' +
            '✓ You have access to this resource in your workspace';
    } else if (statusCode === 429) {
        errorMessage = '⏱️ Rate Limit Exceeded';
        suggestions = apiErrorMessage || 'Too many requests. Please wait a moment and try again.';
    } else if (statusCode && statusCode >= 500) {
        errorMessage = '🔧 Server Error';
        suggestions = apiErrorMessage || 'xR2 server is experiencing issues. Please try again in a few moments.';
    } else {
        errorMessage = '⚠️ ' + (apiErrorMessage || error.message || 'Request Failed');
        suggestions = apiSuggestion || '';
    }

    // Combine message with details
    let fullMessage = errorMessage;

    if (suggestions) {
        fullMessage += `\n\n💡 ${suggestions}`;
    }

    if (statusForMessage !== undefined) {
        fullMessage += `\n\n🔍 HTTP Status: ${statusForMessage}`;
    }

    // Create enhanced error object
    const enhancedError = {
        ...error,
        message: fullMessage,
        httpCode: statusForMessage || 'unknown',
        description: fullMessage,
        statusCode: statusForMessage,
    };

    throw new NodeApiError(this.getNode(), enhancedError as JsonObject);
}

export async function xr2GetRequest(this: any, options: RequestOptions) {
    const requestOptions = {
        method: 'GET',
        json: true,
        ...options,
    };

    try {
        const response = await this.helpers.httpRequestWithAuthentication.call(
            this,
            'xr2Api',
            requestOptions,
        );
        return response;
    } catch (error: any) {
        throw handleXr2Error.call(this, error);
    }
}

export async function xr2Request(this: any, options: RequestOptions) {
    const requestOptions = {
        method: 'POST',
        json: true,
        ...options,
    };

    try {
        const response = await this.helpers.httpRequestWithAuthentication.call(
            this,
            'xr2Api',
            requestOptions,
        );
        return response;
    } catch (error: any) {
        throw handleXr2Error.call(this, error);
    }
}
