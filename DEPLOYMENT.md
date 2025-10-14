# xR2 Platform - Deployment Guide

## Quick Remote Deployment

Deploy xR2 to your remote server with a single command:

```bash
./deploy-to-server.sh user@your-server.com /opt/xr2
```

### Prerequisites

1. **SSH Access**: Ensure you have SSH key-based authentication configured
2. **Server Requirements**:
   - Ubuntu 20.04+ or similar Linux distribution
   - 2GB+ RAM
   - 20GB+ free disk space

### Deployment Steps

#### 1. Prepare your local environment

```bash
# Make sure you're in the project root
cd /path/to/xR2

# Ensure .env.prod is configured
cp .env.example .env.prod
nano .env.prod  # Edit with production values
```

#### 2. Run deployment script

```bash
# Deploy to remote server
./deploy-to-server.sh root@xr2.uk /opt/xr2
```

The script will:
- Test SSH connection
- Copy all project files to the server
- Install Docker and Docker Compose (if not installed)
- Build Docker images
- Start all services (PostgreSQL, Redis, Backend, Frontend, Nginx)

#### 3. Post-deployment configuration

SSH to your server:

```bash
ssh root@xr2.uk
cd /opt/xr2
```

Edit production environment variables:

```bash
nano .env.prod
```

**Important variables to configure:**

```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# Security
SECRET_KEY=your_32_char_secret_key_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password_here

# Domain
CORS_ORIGINS=https://xr2.uk
EXTERNAL_API_BASE_URL=https://xr2.uk
```

Restart services after editing:

```bash
docker-compose restart
```

#### 4. SSL Configuration (Recommended)

For production, configure SSL certificates:

```bash
# Option 1: Let's Encrypt (recommended)
sudo apt install certbot
certbot certonly --standalone -d xr2.uk

# Copy certificates to nginx/ssl
cp /etc/letsencrypt/live/xr2.uk/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/xr2.uk/privkey.pem nginx/ssl/key.pem

# Option 2: Self-signed (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Restart nginx
docker-compose restart nginx
```

## Service Management

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### Check service status

```bash
docker-compose ps
```

### Restart services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart app
docker-compose restart frontend
```

### Stop services

```bash
docker-compose down
```

### Update deployment

```bash
# On your local machine
./deploy-to-server.sh root@xr2.uk /opt/xr2

# On the server
cd /opt/xr2
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Service URLs

After successful deployment:

- **Application**: https://xr2.uk
- **API Documentation**: https://xr2.uk/docs
- **Admin Panel**: https://xr2.uk/admin
- **Health Check**: https://xr2.uk/health

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs

# Check disk space
df -h

# Check Docker status
systemctl status docker
```

### Database connection errors

```bash
# Check PostgreSQL status
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Re-initialize database
docker-compose up db-init
```

### Frontend not accessible

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Nginx errors

```bash
# Test nginx configuration
docker-compose exec nginx nginx -t

# Check nginx logs
docker-compose logs nginx

# Restart nginx
docker-compose restart nginx
```

## Local Development

For local development without Docker:

```bash
./start.sh
```

This will start:
- Backend at http://localhost:8000
- Frontend at http://localhost:3000

## Architecture

```
┌─────────────────────────────────────────┐
│           Nginx (Port 80/443)           │
│         (Reverse Proxy + SSL)           │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼────────┐  ┌────▼────────┐
│   Frontend      │  │   Backend   │
│   (Next.js)     │  │  (FastAPI)  │
│   Port 3000     │  │  Port 8000  │
└─────────────────┘  └────┬────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
         ┌──────▼──────┐    ┌──────▼──────┐
         │  PostgreSQL │    │    Redis    │
         │  Port 5432  │    │  Port 6379  │
         └─────────────┘    └─────────────┘
```

## Security Checklist

- [ ] Changed default passwords in .env.prod
- [ ] Configured SSL certificates
- [ ] Set strong SECRET_KEY (32+ characters)
- [ ] Configured firewall (allow 80, 443, 22 only)
- [ ] Set up regular backups
- [ ] Configured CORS_ORIGINS to your domain only
- [ ] Reviewed nginx security settings
- [ ] Set up monitoring/logging

## Backup & Restore

### Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U xr2_user xr2_db > backup.sql

# Backup volumes
docker run --rm \
  -v xr2_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Restore

```bash
# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U xr2_user xr2_db

# Restore volumes
docker run --rm \
  -v xr2_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/xr2/issues
- Documentation: https://xr2.uk/docs
