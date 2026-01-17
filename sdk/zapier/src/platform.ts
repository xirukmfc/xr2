import { Bundle, ZObject, HttpRequestOptions } from 'zapier-platform-core';
import { BASE_URL } from './shared/config';

const authentication = {
    type: 'custom' as const,
    fields: [
        { key: 'apiKey', label: 'API Key', required: true, type: 'string' as const, helpText: 'Your xR2 Product API Key from https://xr2.uk/api-keys' },
    ],
    test: async (z: ZObject, bundle: Bundle) => {
        const response = await z.request({
            url: `${BASE_URL}/api/v1/check-api-key`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${bundle.authData.apiKey}`,
                'Accept': 'application/json',
            },
        });
        return response.data;
    },
    connectionLabel: '{{user}}',
};

const checkApiKey = {
    key: 'check_api_key',
    noun: 'API Key',
    display: {
        label: 'Check API Key',
        description: 'Validate your API key and get the username associated with it',
    },
    operation: {
        inputFields: [],
        perform: async (z: ZObject, bundle: Bundle) => {
            const response = await z.request({
                url: `${BASE_URL}/api/v1/check-api-key`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${bundle.authData.apiKey}`,
                    'Accept': 'application/json',
                },
            });
            return response.data;
        },
        sample: {
            ok: true,
            user: 'your_username',
        },
    },
};

const getPrompt = {
    key: 'get_prompt',
    noun: 'Prompt',
    display: {
        label: 'Get Prompt',
        description: 'Fetch a prompt by slug. Returns system, user, and assistant prompts, variables, and trace_id for event tracking.',
    },
    operation: {
        inputFields: [
            { key: 'slug', label: 'Prompt Slug', required: true, type: 'string' as const, helpText: 'Unique prompt identifier from your xR2 dashboard' },
            { key: 'version_number', label: 'Version Number', required: false, type: 'integer' as const, helpText: 'Specific version to fetch (leave empty for latest deployed)' },
            { key: 'status', label: 'Status Filter', required: false, type: 'string' as const, choices: ['production', 'testing', 'draft', 'inactive', 'deprecated'], helpText: 'Filter by version status' },
        ],
        perform: async (z: ZObject, bundle: Bundle) => {
            const body: Record<string, any> = {
                slug: bundle.inputData.slug,
                source_name: 'zapier_sdk',
            };
            if (bundle.inputData.version_number) {
                body.version_number = bundle.inputData.version_number;
            }
            if (bundle.inputData.status) {
                body.status = bundle.inputData.status;
            }
            const response = await z.request({
                url: `${BASE_URL}/api/v1/get-prompt`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bundle.authData.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: body,
            });
            return response.data;
        },
        sample: {
            slug: 'my-prompt',
            source_name: 'zapier_sdk',
            version_number: 2,
            status: 'production',
            system_prompt: 'You are a helpful assistant',
            user_prompt: 'Help me with {{task}}',
            assistant_prompt: '',
            variables: [
                { name: 'task', type: 'string', defaultValue: '' }
            ],
            model_config: {},
            trace_id: 'evt_550e8400_1234567890_abcd1234',
            deployed_at: '2025-11-28T14:46:01.812013Z',
            created_at: '2025-11-16T08:37:48.891068Z',
            updated_at: '2025-11-28T14:46:01.767124Z',
            ab_test_id: null,
            ab_test_name: null,
            ab_test_variant: null,
        },
    },
};

const trackEvent = {
    key: 'track_event',
    noun: 'Event',
    display: {
        label: 'Track Event',
        description: 'Send a business event tied to a prompt trace. Use trace_id from Get Prompt response.',
    },
    operation: {
        inputFields: [
            { key: 'trace_id', label: 'Trace ID', required: true, type: 'string' as const, helpText: 'Request identifier from the Get Prompt response (trace_id field)' },
            { key: 'event_name', label: 'Event Name', required: true, type: 'string' as const, helpText: 'Event name defined in xR2 Analytics (e.g., sign_up, purchase_completed)' },
            { key: 'user_id', label: 'User ID', required: false, type: 'string' as const, helpText: 'Optional user identifier for the event' },
            { key: 'session_id', label: 'Session ID', required: false, type: 'string' as const, helpText: 'Optional session identifier for analytics' },
            { key: 'value', label: 'Value', required: false, type: 'number' as const, helpText: 'Numeric value for revenue tracking, order amounts, etc.' },
            { key: 'currency', label: 'Currency', required: false, type: 'string' as const, helpText: 'Currency code (e.g., USD, EUR)' },
            { key: 'metadata', label: 'Metadata', required: false, type: 'string' as const, helpText: 'JSON object with custom fields (e.g., {"order_id": "123", "plan": "premium"})' },
        ],
        perform: async (z: ZObject, bundle: Bundle) => {
            const body: Record<string, any> = {
                trace_id: bundle.inputData.trace_id,
                event_name: bundle.inputData.event_name,
                source_name: 'zapier_sdk',
            };

            if (bundle.inputData.user_id) {
                body.user_id = bundle.inputData.user_id;
            }
            if (bundle.inputData.session_id) {
                body.session_id = bundle.inputData.session_id;
            }
            if (bundle.inputData.value) {
                body.value = bundle.inputData.value;
            }
            if (bundle.inputData.currency) {
                body.currency = bundle.inputData.currency;
            }

            // Parse metadata JSON
            if (bundle.inputData.metadata) {
                try {
                    body.metadata = JSON.parse(bundle.inputData.metadata as string);
                } catch (e) {
                    body.metadata = {};
                }
            } else {
                body.metadata = {};
            }

            const response = await z.request({
                url: `${BASE_URL}/api/v1/events`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bundle.authData.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: body,
            });
            return response.data;
        },
        sample: {
            status: 'success',
            event_id: 'evt_123abc',
            trace_id: 'evt_550e8400_1234567890_abcd1234',
            event_name: 'sign_up',
            timestamp: '2025-01-15T10:30:00Z',
            is_duplicate: false,
        },
    },
};

export function createApp({ version }: { version: string }) {
    return {
        version,
        platformVersion: require('zapier-platform-core').version,
        authentication,
        creates: {
            [checkApiKey.key]: checkApiKey,
            [getPrompt.key]: getPrompt,
            [trackEvent.key]: trackEvent,
        },
    };
}
