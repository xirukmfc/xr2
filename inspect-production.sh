#!/bin/bash
# Script to inspect production server for CVE-2025-66478 compromise indicators
# Run this BEFORE cleanup to gather forensic evidence

set -e

SERVER="<PROD_HOST>"
PASSWORD="***REMOVED***"

echo "🔍 FORENSIC INSPECTION: CVE-2025-66478 Compromise"
echo "=================================================="
echo ""

# Function to run remote command
run_remote() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER "$1"
}

echo "1️⃣ Checking for malicious files in frontend container..."
echo "   Looking for: /tmp/f, payload files, base64 scripts, .ddns domains"
run_remote "docker exec xr2_frontend_prod sh -c 'ls -la /tmp 2>/dev/null || echo No /tmp directory'" || true
run_remote "docker exec xr2_frontend_prod sh -c 'find / -name \"*.ddns.*\" 2>/dev/null | head -10'" || true
run_remote "docker exec xr2_frontend_prod sh -c 'find /tmp -type f 2>/dev/null | xargs ls -la'" || true

echo ""
echo "2️⃣ Checking for suspicious processes..."
run_remote "docker exec xr2_frontend_prod ps aux | grep -E 'wget|curl|ping|nc|bash|sh' | grep -v grep" || echo "   No suspicious processes found"

echo ""
echo "3️⃣ Checking nginx access logs for attack patterns..."
echo "   Looking for: /api routes with POST requests, suspicious User-Agents"
run_remote "docker logs xr2_nginx_prod 2>&1 | grep -E 'POST /api|User-Agent.*curl|User-Agent.*wget' | tail -50" || echo "   No suspicious requests found"

echo ""
echo "4️⃣ Checking for DNS exfiltration attempts..."
echo "   Looking for: .ddns. domains in logs"
run_remote "docker logs xr2_frontend_prod 2>&1 | grep -i 'ddns' | tail -20" || echo "   No DNS exfiltration found"

echo ""
echo "5️⃣ Checking container uptime (old containers = likely compromised)..."
run_remote "docker ps --filter 'name=xr2' --format 'table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}'"

echo ""
echo "6️⃣ Checking for base64-encoded payloads in logs..."
run_remote "docker logs xr2_frontend_prod 2>&1 | grep -E 'base64|which sh' | tail -20" || echo "   No base64 payloads found"

echo ""
echo "7️⃣ Checking Node.js version in container..."
run_remote "docker exec xr2_frontend_prod node --version"
run_remote "docker exec xr2_frontend_prod sh -c 'cat package.json | grep \"\\\"next\\\"\"'" 2>/dev/null || echo "   Could not read Next.js version"

echo ""
echo "8️⃣ Checking for modified system files..."
run_remote "docker exec xr2_frontend_prod sh -c 'find /usr/local/bin -type f -mtime -7 2>/dev/null'" || echo "   No recently modified binaries"

echo ""
echo "✅ Inspection complete!"
echo ""
echo "📁 Save this output for incident report"
echo ""
