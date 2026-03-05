import { NodeApiError, IDataObject, IExecuteFunctions, IHttpRequestMethods, JsonObject } from 'n8n-workflow';

export interface RequestOptions {
    url: string;
    body?: IDataObject;
    method?: IHttpRequestMethods;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function handleXr2Error(this: IExecuteFunctions, error: Error & Record<string, unknown>): never {
    // n8n error objects carry arbitrary fields (httpCode, statusCode, response, etc.)
    const err = error as Record<string, any>;
    const res = (err.response ?? {}) as Record<string, any>;
    const causeRes = ((err.cause as Record<string, any>)?.response ?? {}) as Record<string, any>;

    // Extract status code from various possible locations
    const rawStatusCode = err.httpCode || err.statusCode || err.status ||
                         res.statusCode || res.status;
    const statusCode = rawStatusCode !== undefined && rawStatusCode !== null
        ? Number(rawStatusCode)
        : undefined;
    const statusForMessage = Number.isFinite(statusCode) ? statusCode : rawStatusCode;

    // Extract error details from response body - check multiple locations
    let apiResponse: Record<string, unknown> | null = null;

    // n8n puts the response in error.errorResponse
    const possibleBodies = [
        err.errorResponse,
        res.body,
        causeRes.body,
        err.body,
        err.data,
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
        const detail = apiResponse.detail as Record<string, any>;
        if (typeof detail === 'object') {
            apiErrorMessage = (detail.message || detail.error || '') as string;
            apiSuggestion = (detail.suggestion || '') as string;
            if (Array.isArray(detail.available_statuses)) {
                apiSuggestion += `\nAvailable statuses: ${(detail.available_statuses as string[]).join(', ')}`;
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

export async function xr2GetRequest(this: IExecuteFunctions, options: RequestOptions) {
    const requestOptions = {
        method: 'GET' as const,
        ...options,
    };

    try {
        return await this.helpers.httpRequestWithAuthentication.call(
            this,
            'xr2Api',
            requestOptions,
        );
    } catch (error) {
        throw handleXr2Error.call(this, error as Error & Record<string, unknown>);
    }
}

export async function xr2Request(this: IExecuteFunctions, options: RequestOptions) {
    const requestOptions = {
        method: 'POST' as const,
        ...options,
    };

    try {
        return await this.helpers.httpRequestWithAuthentication.call(
            this,
            'xr2Api',
            requestOptions,
        );
    } catch (error) {
        throw handleXr2Error.call(this, error as Error & Record<string, unknown>);
    }
}
