import axios from 'axios';
import { BASE_URL, XR2Connection } from '../shared/config';

export interface GetPromptParams {
    slug: string;
    version_number?: number;
    status?: 'draft' | 'testing' | 'production' | 'inactive' | 'deprecated';
}

export async function getPrompt(conn: XR2Connection, params: GetPromptParams) {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/get-prompt`;
    const response = await axios.post(url, { ...params, source_name: 'make_sdk' }, {
        headers: {
            'Authorization': `Bearer ${conn.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        timeout: 10000,
    });
    return response.data;
}

export interface TrackEventParams {
    trace_id: string;
    event_name: string;
    category: string;
    fields: Record<string, any>;
}

export async function trackEvent(conn: XR2Connection, params: TrackEventParams) {
    const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/events`;
    const response = await axios.post(url, params, {
        headers: {
            'Authorization': `Bearer ${conn.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        timeout: 10000,
    });
    return response.data;
}


