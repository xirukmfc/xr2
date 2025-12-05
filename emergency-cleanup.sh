#!/bin/bash
# Emergency cleanup script for CVE-2025-66478 compromised containers
# Run this on production server to remove all potentially infected containers

set -e

echo "🚨 EMERGENCY CLEANUP: CVE-2025-66478 RCE in Next.js 15.2.4"
echo "=========================================="
echo ""

# Step 1: Stop all containers
echo "1️⃣ Stopping all xR2 containers..."
docker-compose down

# Step 2: Remove all containers (including stopped)
echo "2️⃣ Removing all xR2 containers..."
docker ps -a --filter "name=xr2" -q | xargs -r docker rm -f

# Step 3: Remove all images
echo "3️⃣ Removing all xR2 images..."
docker images | grep xr2 | awk '{print $3}' | xargs -r docker rmi -f

# Step 4: Clean Docker system
echo "4️⃣ Cleaning Docker system (volumes, networks, cache)..."
docker system prune -af --volumes

# Step 5: Backup production database (optional but recommended)
echo "5️⃣ Creating database backup..."
BACKUP_FILE="xr2_db_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec xr2_db_prod pg_dump -U xr2_user xr2_db > "/tmp/$BACKUP_FILE" 2>/dev/null || echo "⚠️  Database backup skipped (container not running)"

# Step 6: Check for suspicious files in volumes
echo "6️⃣ Checking Docker volumes for malicious files..."
docker volume ls | grep xr2 | awk '{print $2}' | while read vol; do
    echo "   Inspecting volume: $vol"
    docker run --rm -v "$vol:/data" alpine sh -c "find /data -name '*.sh' -o -name 'f' -o -name 'payload*'" || true
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "⚠️  NEXT STEPS (run on production server):"
echo "   1. Pull latest code: git pull origin master"
echo "   2. Rebuild containers: docker-compose build --no-cache"
echo "   3. Start services: docker-compose up -d"
echo "   4. Check logs: docker-compose logs -f"
echo ""
echo "📝 Inspect production for malicious files:"
echo "   docker exec -it xr2_frontend_prod sh -c 'ls -la /tmp && find / -name \"*.ddns.*\" 2>/dev/null'"
echo ""
