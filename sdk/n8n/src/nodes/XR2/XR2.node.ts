import type { IExecuteFunctions, IDataObject, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { BASE_URL, xr2Request } from '../../helpers/http';

export class XR2 implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'xR2',
        name: 'xr2',
        icon: 'file:xr2.svg',
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
                options: [
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
                description: 'Specific version to fetch',
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
                    { name: 'Draft', value: 'draft' },
                    { name: 'Testing', value: 'testing' },
                    { name: 'Production', value: 'production' },
                    { name: 'Inactive', value: 'inactive' },
                    { name: 'Deprecated', value: 'deprecated' },
                ],
                default: '',
                description: 'Filter by version status',
                displayOptions: {
                    show: {
                        resource: ['prompt'],
                        operation: ['get'],
                    },
                },
            },
            {
                displayName: 'Trace ID',
                name: 'traceId',
                type: 'string',
                default: '',
                required: true,
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
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Category',
                name: 'category',
                type: 'string',
                default: '',
                required: true,
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
            {
                displayName: 'Fields',
                name: 'fields',
                type: 'json',
                default: '{}',
                description: 'Event fields as JSON object',
                displayOptions: {
                    show: {
                        resource: ['event'],
                        operation: ['track'],
                    },
                },
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const resource = this.getNodeParameter('resource', i) as string;
            const operation = this.getNodeParameter('operation', i) as string;

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
                    uri: `${BASE_URL.replace(/\/$/, '')}/api/v1/get-prompt`,
                    body,
                } as any);

                returnData.push({ json: response as IDataObject });
            }

            if (resource === 'event' && operation === 'track') {
                const traceId = this.getNodeParameter('traceId', i) as string;
                const eventName = this.getNodeParameter('eventName', i) as string;
                const category = this.getNodeParameter('category', i) as string;
                const fields = this.getNodeParameter('fields', i, '{}') as string;

                const body: IDataObject = {
                    trace_id: traceId,
                    event_name: eventName,
                    category: category,
                    fields: JSON.parse(fields),
                };

                const response = await xr2Request.call(this, {
                    uri: `${BASE_URL.replace(/\/$/, '')}/api/v1/events`,
                    body,
                } as any);

                returnData.push({ json: response as IDataObject });
            }
        }

        return [returnData];
    }
}


