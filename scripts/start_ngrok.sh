#!/bin/bash

# Script to start ngrok for YooKassa webhook testing
# Usage: ./scripts/start_ngrok.sh

echo "🚀 Starting ngrok for YooKassa webhook testing..."
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed!"
    echo ""
    echo "Install ngrok:"
    echo "  macOS: brew install ngrok"
    echo "  or download from: https://ngrok.com/download"
    exit 1
fi

# Start ngrok on port 8000 (FastAPI backend)
echo "📡 Starting ngrok tunnel to localhost:8000..."
echo ""
echo "After ngrok starts, copy the HTTPS URL (e.g., https://abc123.ngrok-free.app)"
echo ""
echo "Then configure in YooKassa test dashboard:"
echo "  1. Go to: https://yookassa.ru/my/merchant/integration/http-notifications"
echo "  2. Set URL: <your-ngrok-url>/internal/webhooks/yookassa"
echo "  3. Enable events: payment.succeeded, payment.canceled"
echo ""
echo "Test card: 4111 1111 1111 1111, any future date, any CVV"
echo ""
echo "Press Ctrl+C to stop ngrok"
echo "─────────────────────────────────────────────────────────"
echo ""

ngrok http 8000
