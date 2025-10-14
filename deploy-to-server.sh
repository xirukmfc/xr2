#!/bin/bash

# xR2 Platform - Remote Server Deployment Script
# ==============================================
# Usage: ./deploy-to-server.sh [user@]hostname [path]
# Example: ./deploy-to-server.sh root@xr2.uk /opt/xr2

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST=${1:-""}
REMOTE_PATH=${2:-"/opt/xr2"}
LOCAL_PATH="$(pwd)"

echo -e "${BLUE}🚀 xR2 Platform - Remote Server Deployment${NC}"
echo "=============================================="

# Validate arguments
if [ -z "$REMOTE_HOST" ]; then
    echo -e "${RED}❌ Error: Remote host not specified${NC}"
    echo "Usage: ./deploy-to-server.sh [user@]hostname [remote_path]"
    echo "Example: ./deploy-to-server.sh root@xr2.uk /opt/xr2"
    exit 1
fi

echo -e "${YELLOW}📍 Configuration:${NC}"
echo "   Remote host: $REMOTE_HOST"
echo "   Remote path: $REMOTE_PATH"
echo "   Local path:  $LOCAL_PATH"
echo ""

# Test SSH connection
echo -e "${YELLOW}🔐 Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$REMOTE_HOST" exit 2>/dev/null; then
    echo -e "${RED}❌ Cannot connect to $REMOTE_HOST${NC}"
    echo "Please ensure:"
    echo "  1. SSH key is configured"
    echo "  2. Server is accessible"
    echo "  3. Username and hostname are correct"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection successful${NC}"

# Create remote directory
echo -e "${YELLOW}📁 Creating remote directory...${NC}"
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Copy files to server (excluding unnecessary files)
echo -e "${YELLOW}📦 Copying files to server...${NC}"
rsync -avz --progress \
    --exclude '.git' \
    --exclude '.venv' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude 'logs' \
    --exclude '.DS_Store' \
    --exclude '.env.local' \
    --exclude 'postgres_data' \
    --exclude 'redis_data' \
    "$LOCAL_PATH/" "$REMOTE_HOST:$REMOTE_PATH/"

echo -e "${GREEN}✅ Files copied successfully${NC}"

# Execute deployment on remote server
echo -e "${YELLOW}🔨 Executing deployment on remote server...${NC}"
ssh "$REMOTE_HOST" << ENDSSH
    set -e
    cd $REMOTE_PATH

    echo -e "${BLUE}📋 Checking Docker installation...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker not installed on remote server${NC}"
        echo "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl enable docker
        systemctl start docker
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ Docker Compose not installed${NC}"
        echo "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    echo -e "${GREEN}✅ Docker is ready${NC}"

    # Check if .env.prod exists, if not copy from example
    if [ ! -f .env.prod ]; then
        echo -e "${YELLOW}📝 Creating .env.prod from .env.example...${NC}"
        if [ -f .env.example ]; then
            cp .env.example .env.prod
            echo -e "${RED}⚠️  Please edit .env.prod and set production passwords!${NC}"
        fi
    fi

    # Stop existing containers
    echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
    docker-compose down || true

    # Build images
    echo -e "${YELLOW}🔨 Building Docker images...${NC}"
    docker-compose build --no-cache

    # Start services
    echo -e "${YELLOW}🚀 Starting services...${NC}"
    docker-compose up -d

    # Wait for services to be ready
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 15

    # Check service status
    echo -e "${YELLOW}📊 Service status:${NC}"
    docker-compose ps

    # Show logs
    echo -e "${YELLOW}📝 Recent logs:${NC}"
    docker-compose logs --tail=50

    echo ""
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo "=============================================="
    echo -e "${YELLOW}Service URLs:${NC}"
    echo "  🌐 Application: https://xr2.uk"
    echo "  📚 API Docs:    https://xr2.uk/docs"
    echo "  🔐 Admin:       https://xr2.uk/admin"
    echo ""
    echo -e "${YELLOW}Useful commands (on server):${NC}"
    echo "  cd $REMOTE_PATH"
    echo "  docker-compose logs -f        # View logs"
    echo "  docker-compose ps             # Check status"
    echo "  docker-compose restart        # Restart services"
    echo "  docker-compose down           # Stop services"
    echo ""
ENDSSH

echo -e "${GREEN}✅ Remote deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}🔗 Access your application at: https://xr2.uk${NC}"
echo ""
echo -e "${RED}⚠️  Important next steps:${NC}"
echo "  1. SSH to your server: ssh $REMOTE_HOST"
echo "  2. Edit .env.prod with secure passwords: cd $REMOTE_PATH && nano .env.prod"
echo "  3. Restart services: docker-compose restart"
echo "  4. Configure SSL certificates in nginx/ssl/ directory"
echo ""
