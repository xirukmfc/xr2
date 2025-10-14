import { createApp as coreCreateApp, App, Bundle, ZObject } from 'zapier-platform-core';
import axios from 'axios';
import { BASE_URL } from './shared/config';

const authentication = {
    type: 'custom' as const,
    fields: [
        { key: 'apiKey', label: 'API Key', required: true, type: 'string' },
    ],
    test: async (z: ZObject, bundle: Bundle) => {
        // Quick HEAD/GET to health endpoint to validate
        const url = `${BASE_URL.replace(/\/$/, '')}/health`;
        const res = await axios.get(url, { timeout: 5000 });
        return res.data;
    },
    connectionLabel: 'xR2',
};

const getPrompt = {
    key: 'get_prompt',
    noun: 'Prompt',
    display: {
        label: 'Get Prompt',
        description: 'Fetch a prompt by slug and source name',
    },
    operation: {
        inputFields: [
            { key: 'slug', required: true, type: 'string' },
            // source_name is set internally as 'zapier_sdk'
            { key: 'version_number', required: false, type: 'integer' },
            { key: 'status', required: false, type: 'string', choices: ['draft', 'testing', 'production', 'inactive', 'deprecated'] },
        ],
        perform: async (z: ZObject, bundle: Bundle) => {
            const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/get-prompt`;
            const res = await axios.post(url, { ...bundle.inputData, source_name: 'zapier_sdk' }, {
                headers: {
                    'Authorization': `Bearer ${bundle.authData.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 10000,
            });
            return res.data;
        },
        sample: {
            slug: 'welcome',
            source_name: 'username',
            version_number: 1,
            status: 'production',
            trace_id: 'evt_abc_123',
        },
    },
};

const trackEvent = {
    key: 'track_event',
    noun: 'Event',
    display: {
        label: 'Track Event',
        description: 'Send an event with trace_id',
    },
    operation: {
        inputFields: [
            { key: 'trace_id', required: true, type: 'string' },
            { key: 'event_name', required: true, type: 'string' },
            { key: 'category', required: true, type: 'string' },
            { key: 'fields', required: false, type: 'string', helpText: 'JSON string of event fields' },
        ],
        perform: async (z: ZObject, bundle: Bundle) => {
            const url = `${BASE_URL.replace(/\/$/, '')}/api/v1/events`;
            const fields = bundle.inputData.fields ? JSON.parse(bundle.inputData.fields) : {};
            const res = await axios.post(url, {
                trace_id: bundle.inputData.trace_id,
                event_name: bundle.inputData.event_name,
                category: bundle.inputData.category,
                fields,
            }, {
                headers: {
                    'Authorization': `Bearer ${bundle.authData.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 10000,
            });
            return res.data;
        },
        sample: {
            trace_id: 'evt_abc_123',
            event_name: 'signup_success',
            category: 'user_lifecycle',
            fields: { user_id: '123' },
        },
    },
};

export function createApp({ version }: { version: string }): App {
    return coreCreateApp({
        version,
        platformVersion: require('zapier-platform-core').version,
        authentication,
        creates: {
            [getPrompt.key]: getPrompt,
            [trackEvent.key]: trackEvent,
        },
    });
}


