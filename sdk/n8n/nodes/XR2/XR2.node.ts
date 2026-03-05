import type { IExecuteFunctions, IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { xr2Request, xr2GetRequest } from '../../helpers/http';

export class XR2 implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'xR2',
        name: 'xr2',
        icon: 'file:xr2-logo.svg',
        group: ['transform'],
        version: 1,
        description: 'Interact with xR2 APIs',
        defaults: {
            name: 'xR2',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'xr2Api',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
																noDataExpression: true,
                options: [
                    {
                        name: 'API Key',
                        value: 'apiKey',
                    },
                    {
                        name: 'Prompt',
                        value: 'prompt',
                    },
                    {
                        name: 'Event',
                        value: 'event',
                    },
                ],
                default: 'prompt',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
																noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['apiKey'],
                    },
                },
                options: [
                    {
                        name: 'Check',
                        value: 'check',
                        action: 'Check API key',
                        description: 'Validate API key and get username',
                    },
                ],
                default: 'check',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
																noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                    },
                },
                options: [
                    {
                        name: 'Get',
                        value: 'get',
                        action: 'Get prompt',
                        description: 'Fetch a prompt by slug',
                    },
                ],
                default: 'get',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
																noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: ['event'],
                    },
                },
                options: [
                    {
                        name: 'Track',
                        value: 'track',
                        action: 'Track event',
                        description: 'Send an event with trace_id',
                    },
                ],
                default: 'track',
            },
            {
                displayName: 'Slug',
                name: 'slug',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                        operation: ['get'],
                    },
                },
            },
            
            {
                displayName: 'Version Number',
                name: 'versionNumber',
                type: 'number',
                default: 0,
                typeOptions: { minValue: 0 },
                description: 'Specific version number to fetch (0 = latest deployed version). Use this when you need a particular version of the prompt.',
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                        operation: ['get'],
                    },
                },
            },
            {
                displayName: 'Status',
                name: 'status',
                type: 'options',
                options: [
                    { name: 'Any (Default)', value: '' },
                    { name: 'Deprecated', value: 'deprecated' },
                    { name: 'Draft', value: 'draft' },
                    { name: 'Inactive', value: 'inactive' },
                    { name: 'Production', value: 'production' },
                    { name: 'Testing', value: 'testing' },
                ],
                default: '',
                description: 'Filter by version status. Leave as "Any" to get the latest deployed version regardless of status. Only use specific statuses if you need a particular version.',
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                        operation: ['get'],
                    },
                },
            },
            {
                displayName: 'Variable Values',
                name: 'variableValues',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                default: {},
                placeholder: 'Add Variable',
                description: 'Values to replace {{variable}} placeholders. Supports n8n expressions. Leave empty to get raw template.',
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                        operation: ['get'],
                    },
                },
                options: [
                    {
                        displayName: 'Variable',
                        name: 'variable',
                        values: [
                            {
                                displayName: 'Name',
                                name: 'name',
                                type: 'string',
                                default: '',
                            },
                            {
                                displayName: 'Value',
                                name: 'value',
                                type: 'string',
                                default: '',
                            },
                        ],
                    },
                ],
            },
            {
                displayName: 'Trace ID',
                name: 'traceId',
                type: 'string',
                default: '',
                required: true,
                description: 'Trace ID from Get Prompt response',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Event Name',
                name: 'eventName',
                type: 'string',
                default: '',
                required: true,
                description: 'Event name as defined in dashboard (e.g., "signup_success", "purchase_completed")',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'User ID',
                name: 'userId',
                type: 'string',
                default: '',
                description: 'Optional user identifier for tracking',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Session ID',
                name: 'sessionId',
                type: 'string',
                default: '',
                description: 'Optional session identifier for analytics',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Value',
                name: 'value',
                type: 'number',
                default: 0,
                description: 'Numeric value for revenue tracking, order amounts, etc. (0 = not set).',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Currency',
                name: 'currency',
                type: 'string',
                default: '',
                description: 'Currency code (e.g., "USD", "EUR")',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Metadata',
                name: 'metadata',
                type: 'json',
                default: '{}',
                description: 'Custom event metadata as JSON object (e.g., {"plan": "premium", "order_id": "123"})',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
        ],
		usableAsTool: true,
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        // Get base URL from credentials
        const credentials = await this.getCredentials('xr2Api');
        const baseUrl = ((credentials.baseUrl as string) || 'https://xr2.uk').replace(/\/$/, '');

        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i) as string;
            const operation = this.getNodeParameter('operation', i) as string;

            // Check API Key
            if (resource === 'apiKey' && operation === 'check') {
                const response = await xr2GetRequest.call(this, {
                    url: `${baseUrl}/api/v1/check-api-key`,
                });

                returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
            }

            // Get Prompt
            if (resource === 'prompt' && operation === 'get') {
                const slug = this.getNodeParameter('slug', i) as string;
                const versionNumber = this.getNodeParameter('versionNumber', i, 0) as number;
                const status = this.getNodeParameter('status', i, '') as string;

                const body: IDataObject = {
                    slug,
                    source_name: 'n8n_sdk',
                };
                if (versionNumber && Number(versionNumber) > 0) body.version_number = Number(versionNumber);
                if (status) body.status = status;

                const response = await xr2Request.call(this, {
                    url: `${baseUrl}/api/v1/get-prompt`,
                    body,
                }) as IDataObject;

                // Variable rendering
                const variableValues = this.getNodeParameter('variableValues', i, {}) as IDataObject;
                const variableEntries = (variableValues.variable as IDataObject[] | undefined) || [];

                if (variableEntries.length > 0) {
                    // Build values dict from user input
                    const values: Record<string, string> = {};
                    for (const entry of variableEntries) {
                        const name = entry.name as string;
                        const value = entry.value as string;
                        if (name) values[name] = value;
                    }

                    // Apply defaults from response.variables for keys not provided
                    const responseVars = (response.variables as Array<{ name: string; default?: string }>) || [];
                    for (const v of responseVars) {
                        if (v.name && !(v.name in values) && v.default !== undefined) {
                            values[v.name] = v.default;
                        }
                    }

                    // Replace {{name}} and {name} in prompt fields
                    const promptFields = ['system_prompt', 'user_prompt', 'assistant_prompt'];
                    for (const field of promptFields) {
                        if (typeof response[field] === 'string') {
                            let text = response[field] as string;
                            for (const [name, value] of Object.entries(values)) {
                                text = text.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), value);
                                text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
                            }
                            response[field] = text;
                        }
                    }

                    response.variables_used = values;
                }

                returnData.push({ json: response, pairedItem: { item: i } });
            }

            // Track Event
            if (resource === 'event' && operation === 'track') {
                const traceId = this.getNodeParameter('traceId', i) as string;
                const eventName = this.getNodeParameter('eventName', i) as string;
                const userId = this.getNodeParameter('userId', i, '') as string;
                const sessionId = this.getNodeParameter('sessionId', i, '') as string;
                const value = this.getNodeParameter('value', i, 0) as number;
                const currency = this.getNodeParameter('currency', i, '') as string;
                const metadataStr = this.getNodeParameter('metadata', i, '{}') as string;

                const body: IDataObject = {
                    trace_id: traceId,
                    event_name: eventName,
                    source_name: 'n8n_sdk',
                };

                // Add optional fields only if they have values
                if (userId) body.user_id = userId;
                if (sessionId) body.session_id = sessionId;
                if (value && value > 0) body.value = value;
                if (currency) body.currency = currency;

                // Parse metadata
                try {
                    const metadata = JSON.parse(metadataStr);
                    if (Object.keys(metadata).length > 0) {
                        body.metadata = metadata;
                    }
                } catch {
                    // Invalid JSON, skip metadata
                }

                const response = await xr2Request.call(this, {
                    url: `${baseUrl}/api/v1/events`,
                    body,
                });

                returnData.push({ json: response as IDataObject, pairedItem: { item: i } });
            }
        }

        return [returnData];
    }
}
