# xR2 Platform

AI Prompt Management & Analytics platform with A/B testing, conversion funnels, and multi-LLM support.

**Production:** https://xr2.uk
**Documentation:** https://xr2.gitbook.io/docs

## Quick Start

### Production (Docker)

```bash
make deploy
```

### Local Development

```bash
./start.sh
```

Or manually:

```bash
# Terminal 1: Backend
make up-local

# Terminal 2: Frontend
cd prompt-editor && pnpm dev
```

Open http://localhost

## Features

- **Prompt Management** - Create, version, and organize AI prompts
- **A/B Testing** - Test prompt variations with statistical analysis
- **Analytics** - Track usage, performance, and conversion metrics
- **Conversion Funnels** - Monitor user journeys and drop-off points
- **Multi-LLM Support** - OpenAI, Anthropic, Google, DeepSeek, and more
- **Public API** - RESTful API with SDK support
- **Real-time Monitoring** - Prometheus + Grafana dashboards

## Architecture

| Component | Technology |
|-----------|------------|
| Backend | FastAPI (Python 3.11+) |
| Frontend | Next.js 14 + TypeScript |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Proxy | Nginx + Cloudflare |
| Monitoring | Prometheus + Grafana |

## Services

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & rate limiting |
| FastAPI | 8000 | Backend API |
| Next.js | 3000 | Frontend |
| Nginx | 80, 443 | Reverse proxy |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3002 | Dashboards |

## Main Commands

```bash
make help           # Show all commands
make deploy         # Deploy to production
make up-local       # Start backend for development
make down           # Stop all services
make status         # Show service status
make logs           # View logs
make health         # Health check
make db-backup      # Backup database
make db-restore     # Restore from backup
make test-local     # Run tests locally
```

## Project Structure

```
xR2/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── prompts.py       # Prompt management
│   │   ├── ab_tests_simple.py  # A/B testing
│   │   ├── analytics.py     # Analytics
│   │   ├── conversion_funnels.py
│   │   ├── events.py        # Event tracking
│   │   ├── llm.py           # LLM providers
│   │   └── public_api.py    # Public API
│   ├── models/              # Database models
│   ├── core/                # Config, DB, security
│   └── services/            # Business logic
├── prompt-editor/           # Next.js frontend
├── sdk/                     # Client SDKs
│   ├── python pip/          # Python SDK
│   ├── make/                # Make integration
│   ├── n8n/                 # n8n integration
│   └── zapier/              # Zapier integration
├── monitoring/              # Prometheus & Grafana configs
├── nginx/                   # Nginx configuration
├── scripts/                 # Utility scripts
└── docker-compose*.yml      # Docker configurations
```

## API Endpoints

Full API documentation: https://xr2.uk/docs

## SDKs

### Python

```bash
pip install xr2-sdk
```

```python
from xr2_sdk import XR2Client

client = XR2Client(api_key="your-api-key")
result = client.prompts.run("my-prompt", variables={"name": "World"})
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/xr2_db

# Security
SECRET_KEY=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
ADMIN_EMAIL=admin@example.com

# Redis
REDIS_URL=redis://localhost:6379/0

# LLM Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

## URLs

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Authentication |
| `/prompts` | Prompt library |
| `/editor/[id]` | Prompt editor |
| `/analytics` | Analytics overview |
| `/api-keys` | API key management |
| `/logs` | API usage logs |
| `/settings` | User settings |
| `/docs` | Swagger API docs |
| `/admin` | Admin panel (SQLAdmin) |

## Security

- JWT authentication with refresh tokens
- Rate limiting via Redis
- Cloudflare WAF & DDoS protection
- UFW firewall (SSH + Cloudflare IPs only)
- Password hashing with bcrypt

## Monitoring

Access Grafana at http://localhost:3002 (or https://xr2.uk:3002 in production)

Default dashboards:
- System metrics (CPU, RAM, Disk)
- API performance
- Database queries
- Container resources

## Troubleshooting

**Database connection error:**
```bash
make db-shell  # Connect to PostgreSQL
```

**View logs:**
```bash
make logs-app      # Backend logs
make logs-frontend # Frontend logs
make logs-nginx    # Nginx logs
```

**Health check:**
```bash
make health
```

**Rebuild containers:**
```bash
make rebuild && make up
```

## License

MIT License
