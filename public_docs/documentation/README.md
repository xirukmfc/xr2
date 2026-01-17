# xR2 Documentation

Official documentation for [xR2](https://xr2.uk/) — a platform for managing, testing, and analyzing AI prompts in production.

## What is xR2?

xR2 helps you manage, version, and optimize prompts for your AI-powered applications:

- **Prompt Management** — Store and organize all your prompts in one place
- **Version Control** — Track changes, test different versions, and roll back when needed
- **A/B Testing** — Run experiments to find the best performing prompts
- **Analytics** — Track events and measure the impact of your prompts on user behavior

## Available SDKs

| SDK | Installation | Description |
|-----|--------------|-------------|
| [Python](gitbook/sdks/python/README.md) | `pip install xr2-sdk` | Sync and async clients |
| [Node.js](gitbook/sdks/nodejs/README.md) | `npm install xr2-sdk` | TypeScript support |
| [n8n](gitbook/sdks/n8n/README.md) | Community node | Visual workflow automation |
| [Make.com](gitbook/sdks/make/README.md) | Custom app | Visual automation platform |
| [Zapier](gitbook/sdks/zapier/README.md) | Zapier app | No-code automation |

## API Endpoints

All SDKs use the same API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/check-api-key` | GET | Validate API key |
| `/api/v1/get-prompt` | POST | Fetch prompt by slug |
| `/api/v1/events` | POST | Track analytics event |

## Getting Started

1. **Create an account** at [xr2.uk](https://xr2.uk)
2. **Get your API key** from [API Keys](https://xr2.uk/api-keys) page
3. **Choose an SDK** that fits your stack
4. **Follow the quickstart** guide for your chosen SDK

## Authentication

All API requests require a Product API key sent as a Bearer token:

```
Authorization: Bearer xr2_prod_xxxxx
```

Get your API key at: https://xr2.uk/api-keys

## Core Concepts

### Prompts

Prompts are templates stored in xR2. Each prompt has:
- **Slug** — unique identifier
- **System prompt** — AI instructions
- **User prompt** — template with variables
- **Variables** — dynamic values to fill in
- **Version** — version number and status

### Events

Track user actions linked to prompts:
- **trace_id** — links event to prompt request
- **event_name** — action name (sign_up, purchase, etc.)
- **value/currency** — for revenue tracking
- **metadata** — custom fields

## Support

- Website: https://xr2.uk
- Email: hello@xr2.uk
