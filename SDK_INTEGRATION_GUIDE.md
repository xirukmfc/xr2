# SDK Integration Guide for xR2 Event Tracking

This guide is for developers creating SDK integrations (n8n nodes, Make.com modules, etc.) for xR2 event tracking.

## Event API Structure

### Endpoint
```
POST /internal/events/events
Authorization: Bearer xr2_prod_YOUR_API_KEY
Content-Type: application/json
```

### Request Schema

```typescript
interface EventRequest {
  // Required fields
  trace_id: string;      // From GET /get-prompt response
  event_name: string;    // Must match Event Definition
  source_name: string;   // Source identifier

  // Standard optional fields (always available)
  user_id?: string;
  session_id?: string;
  value?: number;        // For revenue, amounts
  currency?: string;     // USD, EUR, etc.

  // Custom fields go in metadata
  metadata?: {
    [key: string]: string | number | boolean | object;
  };
}
```

## SDK Implementation Approaches

### Option 1: Fixed Fields (Simpler, Less Flexible)

Show all standard fields + a generic metadata JSON field.

**Pros:**
- Simple to implement
- Works for all events
- No need to fetch Event Definitions

**Cons:**
- Users must manually write JSON for custom fields
- No autocomplete for custom fields
- Harder to use

**Example (n8n node definition):**
```typescript
{
  displayName: 'Track Event',
  name: 'trackEvent',
  type: 'action',
  default: 'trackEvent',
  fields: [
    {
      displayName: 'Event Name',
      name: 'event_name',
      type: 'string',
      required: true,
    },
    {
      displayName: 'Trace ID',
      name: 'trace_id',
      type: 'string',
      required: true,
    },
    {
      displayName: 'Source Name',
      name: 'source_name',
      type: 'string',
      default: 'n8n',
      required: true,
    },
    {
      displayName: 'User ID',
      name: 'user_id',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Session ID',
      name: 'session_id',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Value',
      name: 'value',
      type: 'number',
      default: 0,
      description: 'Numeric value (revenue, amount, etc.)',
    },
    {
      displayName: 'Currency',
      name: 'currency',
      type: 'string',
      default: 'USD',
    },
    {
      displayName: 'Custom Metadata (JSON)',
      name: 'metadata',
      type: 'json',
      default: '{}',
      description: 'Custom fields as JSON object',
    },
  ],
}
```

### Option 2: Dynamic Fields (Advanced, Better UX)

Fetch Event Definitions and dynamically generate fields based on metadata_schema.

**Pros:**
- Best user experience
- Field validation in UI
- Autocomplete for custom fields
- Type-safe

**Cons:**
- More complex to implement
- Requires API call to fetch Event Definitions
- Need to handle API key validation

**Implementation Steps:**

1. **Add API Key Credential:**
```typescript
// credentials/xr2Api.credentials.ts
export class Xr2Api implements ICredentialType {
  name = 'xr2Api';
  displayName = 'xR2 API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
    },
  ];
}
```

2. **Fetch Event Definitions:**
```typescript
async function getEventDefinitions(credentials: ICredentialDataDecryptedObject) {
  const response = await fetch('https://api.xr2.uk/internal/event-definitions', {
    headers: {
      'Authorization': `Bearer ${credentials.apiKey}`,
    },
  });

  return await response.json();
}
```

3. **Dynamic Field Generation:**
```typescript
async function getEventFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const credentials = await this.getCredentials('xr2Api');
  const eventDefinitions = await getEventDefinitions(credentials);

  return eventDefinitions.map((def: any) => ({
    name: def.event_name,
    value: def.event_name,
    description: def.description,
  }));
}

// When event is selected, load its metadata schema
async function getMetadataSchema(
  this: ILoadOptionsFunctions,
  eventName: string
): Promise<INodePropertyOptions[]> {
  const credentials = await this.getCredentials('xr2Api');
  const eventDefinitions = await getEventDefinitions(credentials);

  const eventDef = eventDefinitions.find((d: any) => d.event_name === eventName);

  if (!eventDef || !eventDef.metadata_schema) {
    return [];
  }

  // Convert metadata_schema to node properties
  return eventDef.metadata_schema.map((field: any) => ({
    displayName: field.name,
    name: `metadata_${field.name}`,
    type: field.type === 'number' ? 'number' :
          field.type === 'boolean' ? 'boolean' : 'string',
    required: field.required,
    description: field.description,
    default: field.type === 'number' ? 0 :
             field.type === 'boolean' ? false : '',
  }));
}
```

4. **Build Request Body:**
```typescript
async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    const eventName = this.getNodeParameter('event_name', i) as string;
    const traceId = this.getNodeParameter('trace_id', i) as string;
    const sourceName = this.getNodeParameter('source_name', i, 'n8n') as string;

    // Standard fields
    const userId = this.getNodeParameter('user_id', i, '') as string;
    const sessionId = this.getNodeParameter('session_id', i, '') as string;
    const value = this.getNodeParameter('value', i, undefined) as number | undefined;
    const currency = this.getNodeParameter('currency', i, '') as string;

    // Build metadata from dynamic fields
    const metadata: Record<string, any> = {};
    const allParams = this.getNodeParameter('*', i) as any;

    for (const key in allParams) {
      if (key.startsWith('metadata_')) {
        const fieldName = key.replace('metadata_', '');
        metadata[fieldName] = allParams[key];
      }
    }

    // Build request
    const body: any = {
      event_name: eventName,
      trace_id: traceId,
      source_name: sourceName,
      metadata,
    };

    // Add standard fields only if provided
    if (userId) body.user_id = userId;
    if (sessionId) body.session_id = sessionId;
    if (value !== undefined) body.value = value;
    if (currency) body.currency = currency;

    // Make API request
    const credentials = await this.getCredentials('xr2Api');
    const response = await fetch('https://api.xr2.uk/internal/events/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    returnData.push({ json: result });
  }

  return [returnData];
}
```

## Make.com Integration

For Make.com, the approach is similar but uses their module format:

### Module Definition (base.json)

```json
{
  "name": "xR2",
  "label": "xR2 Prompt Analytics",
  "description": "Track events and measure AI prompt performance",
  "baseUrl": "https://api.xr2.uk",
  "version": "1.0.0",
  "connection": {
    "type": "apiKey",
    "label": "xR2 API Key",
    "help": "Get your API key from https://xr2.uk/api-keys"
  }
}
```

### Track Event Module (modules/trackEvent.json)

**Simple Version:**
```json
{
  "label": "Track Event",
  "description": "Track a custom event",
  "url": "/internal/events/events",
  "method": "POST",
  "parameters": [
    {
      "name": "event_name",
      "type": "text",
      "label": "Event Name",
      "required": true
    },
    {
      "name": "trace_id",
      "type": "text",
      "label": "Trace ID",
      "required": true
    },
    {
      "name": "source_name",
      "type": "text",
      "label": "Source",
      "default": "make",
      "required": true
    },
    {
      "name": "user_id",
      "type": "text",
      "label": "User ID"
    },
    {
      "name": "value",
      "type": "number",
      "label": "Value"
    },
    {
      "name": "currency",
      "type": "text",
      "label": "Currency",
      "default": "USD"
    },
    {
      "name": "metadata",
      "type": "collection",
      "label": "Custom Metadata",
      "spec": [
        {
          "name": "key",
          "type": "text",
          "label": "Field Name"
        },
        {
          "name": "value",
          "type": "text",
          "label": "Value"
        }
      ]
    }
  ]
}
```

## Testing

### Test Event Definition API
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.xr2.uk/internal/event-definitions
```

### Test Event Tracking
```bash
curl -X POST https://api.xr2.uk/internal/events/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "test_trace_123",
    "event_name": "your_event",
    "source_name": "sdk_test",
    "user_id": "test_user",
    "value": 99.99,
    "currency": "USD",
    "metadata": {
      "product_id": "prod_123",
      "test_field": "test_value"
    }
  }'
```

## Error Handling

The API returns standard HTTP status codes:

- `200` - Success
- `400` - Validation error (missing required field, wrong type, etc.)
- `404` - Event definition not found
- `401` - Invalid API key
- `500` - Server error

Error response format:
```json
{
  "detail": "Required metadata field 'product_id' is missing"
}
```

## Best Practices

1. **Cache Event Definitions** - Don't fetch on every event track, cache for 5-10 minutes
2. **Validate Before Sending** - Check required fields in your SDK before API call
3. **Show Helpful Errors** - Parse API errors and show user-friendly messages
4. **Support Expressions** - Allow users to map data from previous steps
5. **Provide Examples** - Show sample JSON in documentation

## Example Repositories

- **n8n Node**: [n8n-nodes-xr2](https://github.com/yourorg/n8n-nodes-xr2)
- **Make.com Module**: [make-xr2-module](https://github.com/yourorg/make-xr2-module)
- **Zapier Integration**: [zapier-xr2](https://github.com/yourorg/zapier-xr2)

## Support

- API Documentation: https://docs.xr2.uk
- Discord: https://discord.gg/xr2
- Email: support@xr2.uk
