import axios, { AxiosError } from 'axios';
import { BASE_URL, XR2Connection } from '../shared/config';

export interface GetPromptParams {
    slug: string;
    version_number?: number;
    status?: 'draft' | 'testing' | 'production' | 'inactive' | 'deprecated';
}

export interface PromptResponse {
    slug: string;
    source_name: string;
    version_number: number;
    status: string;
    system_prompt: string | null;
    user_prompt: string | null;
    assistant_prompt: string | null;
    variables: Array<{
        name: string;
        type: string;
        defaultValue: string;
    }>;
    model_config: Record<string, any>;
    trace_id: string;
    deployed_at: string | null;
    created_at: string;
    updated_at: string;
    ab_test_id: string | null;
    ab_test_name: string | null;
    ab_test_variant: string | null;
}

export interface XR2Response<T> {
    ok: boolean;
    data?: T;
    error?: string;
    status_code: number;
}

function parseError(error: AxiosError): string {
    if (error.response?.data) {
        const data = error.response.data as any;
        if (data.detail?.message) return data.detail.message;
        if (typeof data.detail === 'string') return data.detail;
        if (data.message) return data.message;
    }
    return error.message || 'Unknown error';
}

export async function getPrompt(
    conn: XR2Connection, 
    params: GetPromptParams
): Promise<XR2Response<PromptResponse>> {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/get-prompt`;
    
    try {
        const response = await axios.post(url, {
            slug: params.slug,
            source_name: 'make_sdk',  // Fixed source for analytics tracking
            version_number: params.version_number,
            status: params.status
        }, {
            headers: {
                'Authorization': `Bearer ${conn.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 10000,
        });
        
        return {
            ok: true,
            data: response.data,
            status_code: response.status
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        return {
            ok: false,
            error: parseError(axiosError),
            status_code: axiosError.response?.status || 0
        };
    }
}

export interface TrackEventParams {
    trace_id: string;
    event_name: string;
    category: 'conversion' | 'revenue' | 'engagement' | 'custom';
    fields?: Record<string, any>;
}

export interface EventResponse {
    success: boolean;
    event_id?: string;
    trace_id: string;
    message?: string;
}

export async function trackEvent(
    conn: XR2Connection, 
    params: TrackEventParams
): Promise<XR2Response<EventResponse>> {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/events`;
    
    try {
        const response = await axios.post(url, {
            trace_id: params.trace_id,
            event_name: params.event_name,
            category: params.category,
            fields: params.fields || {}
        }, {
            headers: {
                'Authorization': `Bearer ${conn.apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            timeout: 10000,
        });
        
        return {
            ok: true,
            data: response.data,
            status_code: response.status
        };
    } catch (error) {
        const axiosError = error as AxiosError;
        return {
            ok: false,
            error: parseError(axiosError),
            status_code: axiosError.response?.status || 0
        };
    }
}
