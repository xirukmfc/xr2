# Testing xR2 n8n Node

This guide explains how to test the xR2 n8n community node both locally and in a real n8n instance.

## Prerequisites

- n8n installed (version 1.0.0 or later)
- An xR2 Product API key (get from https://xr2.uk)
- Node.js 18+ and npm

## Option 1: Test in Local n8n Instance

### Step 1: Link the package locally

```bash
cd /Users/pavelkuzko/Documents/channeler/xR2/sdk/n8n

# Build the package
npm run build

# Create a global link
npm link
```

### Step 2: Install n8n globally (if not already)

```bash
npm install n8n -g
```

### Step 3: Create a custom nodes directory

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm link n8n-nodes-xr2
```

### Step 4: Start n8n

```bash
n8n start
```

n8n will automatically detect the linked custom node.

### Step 5: Configure credentials

1. Open n8n in your browser (usually http://localhost:5678)
2. Go to **Settings** → **Credentials** → **New**
3. Search for "xR2 API"
4. Enter your Product API key
5. Save the credential

## Option 2: Install from npm (after publishing)

```bash
# In your n8n installation
cd ~/.n8n/custom
npm install n8n-nodes-xr2
```

Restart n8n to load the node.

## Test Workflow Examples

### Example 1: Get Prompt

Create a workflow with the following nodes:

1. **Manual Trigger** (or any trigger)
2. **xR2 Node**:
   - Resource: `Prompt`
   - Operation: `Get`
   - Slug: `welcome`
   - Version Number: `0` (latest)
   - Status: leave empty (or select `production`)

**Expected Output:**
```json
{
  "content": "Your prompt content here",
  "variables": {...},
  "model_config": {...},
  "trace_id": "uuid-here",
  "version_number": 1,
  "status": "production"
}
```

### Example 2: Get Prompt + Track Event

Create a workflow:

1. **Manual Trigger**
2. **xR2 Node** (Get Prompt):
   - Resource: `Prompt`
   - Operation: `Get`
   - Slug: `welcome`
3. **xR2 Node** (Track Event):
   - Resource: `Event`
   - Operation: `Track`
   - Trace ID: `{{ $json.trace_id }}` (from previous node)
   - Event Name: `sign_up`
   - User ID: `user_123`
   - Metadata: `{}`

### Example 3: Purchase Event

Create a workflow:

1. **Manual Trigger**
2. **xR2 Node** (Get Prompt):
   - Resource: `Prompt`
   - Operation: `Get`
   - Slug: `welcome`
3. **xR2 Node** (Track Event):
   - Resource: `Event`
   - Operation: `Track`
   - Trace ID: `{{ $json.trace_id }}`
   - Event Name: `purchase_completed`
   - User ID: `user_123`
   - Value: `99.99`
   - Currency: `USD`
   - Metadata: `{"order_id": "order_67890", "product_id": "prod_456"}`

## Testing Checklist

- [ ] SDK builds without errors (`npm run build`)
- [ ] Node appears in n8n node palette
- [ ] Credentials can be configured and saved
- [ ] Get Prompt returns valid data for existing slug
- [ ] Get Prompt with version_number parameter works
- [ ] Get Prompt with status parameter works
- [ ] Get Prompt returns error for non-existent slug
- [ ] Track Event successfully sends data
- [ ] Track Event with JSON metadata works
- [ ] trace_id can be passed between Get Prompt and Track Event nodes
- [ ] Node works in both manual and automated workflows

## Troubleshooting

### Node doesn't appear in n8n

1. Check that n8n restarted after installation
2. Verify the package is in `~/.n8n/custom/node_modules/`
3. Check n8n logs for errors: `n8n start --verbose`

### Build errors

```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Authentication errors

- Verify your API key is correct
- Check that the key has proper permissions
- Ensure the key is active in xR2 dashboard

### Request errors

- Check the xR2 API is accessible from your network
- Verify the slug exists in your xR2 account
- Check n8n execution logs for detailed error messages

## Manual API Testing (without n8n)

You can test the xR2 API directly with curl:

### Get Prompt
```bash
curl -X POST https://xr2.uk/api/v1/get-prompt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "welcome",
    "source_name": "n8n_sdk"
  }'
```

### Track Event
```bash
curl -X POST https://xr2.uk/api/v1/events \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "trace_id": "your-trace-id-from-get-prompt",
    "event_name": "sign_up",
    "user_id": "user_123",
    "metadata": {}
  }'
```

## Development Workflow

When making changes to the SDK:

```bash
# 1. Make your changes to src/
# 2. Rebuild
npm run build

# 3. Restart n8n (if using local link)
# The node will automatically reload with changes

# 4. Test in n8n workflow
```

## Publishing the Package

See the main README for publishing instructions.
