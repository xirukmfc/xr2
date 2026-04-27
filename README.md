# xR2

Open source prompt management for teams shipping AI features in production.

I built xR2 after seeing the same pattern at every AI project I worked on: prompts hardcoded in source files, no versioning, no A/B testing, no way to measure which prompt actually drove conversion. Every prompt change required a deploy and a coin flip.

xR2 is my exploration of what prompt infrastructure could look like if built properly. It is a side project, not a venture. Live at https://xr2.uk.

## Why this exists

Most teams treat prompts like config files. They are not config files. They are product copy that ships to users, has measurable impact, and changes behavior in subtle ways. Treating them like config means:

- No version history when something regresses
- No safe rollback when a model swap breaks a flow
- No A/B testing to compare alternatives
- No attribution from prompt variant to business outcome

xR2 treats prompts as first-class product artifacts.

## What is in it

- Prompt versioning with Draft, Staging, and Production stages and rollback
- A/B testing engine with statistical significance tracking
- Event tracking and conversion funnels for ROI attribution per variant
- Multi-LLM support: OpenAI, Anthropic, Google, DeepSeek
- REST API and SDKs for Python, n8n, Make, Zapier
- Self-hosted via Docker, deploys with one command

## Architecture decisions worth flagging

A few choices I made that are not obvious from the code.

**PostgreSQL over a vector database for prompt storage.** Prompts are relational by nature: a prompt has versions, a version has test runs, test runs have events. A vector DB does not buy you anything here, and Postgres gives you proper transactions when version state changes.

**Redis for rate limiting and not for caching.** Cached prompt responses were tempting but defeat the purpose. The point of prompt management is to see real performance, not memoized output. Redis stays in its lane: rate limits and ephemeral state.

**Stage-based versioning over pure git-style branching.** Teams I talked to wanted to think in terms of Draft, Staging, Production. Git-style branching is more powerful but most product teams find it foreign. Pick the model that matches the user, not the model that flatters the engineer.

**Sync collection of events, async processing.** Events come in via synchronous endpoints to avoid lost data on retries, but processing happens in Celery workers. This was a tradeoff between data integrity and write latency.

## What I learned building it

Prompt management is harder than it looks. The interesting problems are not in the UI. They are in eval design, statistical rigor on small sample sizes, and the gap between what developers want and what PMs need from these tools.

Honest state: zero users in production. xR2 is an engineering exploration, not a product launch. The code works, the architecture is real, the problems it solves exist. Shipping infrastructure to a market that does not know it has the problem is its own discipline, separate from building the thing.

## Stack

FastAPI (Python 3.11), Next.js 14 (TypeScript), PostgreSQL 15, Redis 7, Nginx, Docker, Prometheus, Grafana.

## Quick start

```bash
git clone https://github.com/xirukmfc/xr2
cd xr2
./start.sh
```

Open http://localhost.

For full setup, environment variables, deployment commands, and API reference, see the documentation site at https://docs.xr2.uk.

## Project structure

```
xR2/
  app/              FastAPI backend
    api/            API endpoints
    models/         Database models
    core/           Config, DB, security
    services/      Business logic
  prompt-editor/    Next.js frontend
  sdk/              Client SDKs (Python, n8n, Make, Zapier)
  monitoring/       Prometheus and Grafana configs
  nginx/            Nginx configuration
  scripts/          Utility scripts
  docker-compose.yml
```

## Common commands

```bash
make help           Show all commands
make deploy         Deploy to production
make up-local       Start backend for development
make down           Stop all services
make status         Show service status
make logs           View logs
make health         Health check
make db-backup      Backup database
make db-restore     Restore from backup
make test-local     Run tests locally
```

## SDKs

Python:

```bash
pip install xr2-sdk
```

```python
from xr2_sdk import XR2Client

client = XR2Client(api_key="your-api-key")
result = client.prompts.run("my-prompt", variables={"name": "World"})
```

n8n, Make, and Zapier integrations are in the `sdk/` directory.

## API documentation

Full API reference with schemas: https://xr2.uk/docs.

## Security

- JWT authentication with refresh tokens
- Rate limiting via Redis
- Cloudflare WAF and DDoS protection
- UFW firewall (SSH and Cloudflare IPs only)
- Password hashing with bcrypt

## Monitoring

Grafana available at http://localhost:3002 in development.

Default dashboards cover system metrics (CPU, RAM, disk), API performance, database queries, and container resources.

## Troubleshooting

Database connection error:

```bash
make db-shell
```

View logs:

```bash
make logs-app
make logs-frontend
make logs-nginx
```

Health check:

```bash
make health
```

Rebuild containers:

```bash
make rebuild && make up
```

## About

Built by Pavel Kuzko, Product Manager working on AI products in fintech, legal, and data.

LinkedIn: https://linkedin.com/in/pavel-kuzko
Portfolio: https://portfolio.xr2.uk

## License

MIT.
