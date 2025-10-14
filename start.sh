#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting xR2 Platform with Frontend...${NC}"
echo -e "${YELLOW}Backend: http://localhost:8000${NC}"
echo -e "${YELLOW}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}API Docs: http://localhost:8000/docs${NC}"
echo -e "${YELLOW}Admin: http://localhost:8000/admin${NC}"
echo ""

# Function to handle cleanup on script exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT

# Start the backend
echo -e "${GREEN}Starting FastAPI backend...${NC}"
# Activate virtual environment and start backend
source .venv/bin/activate && python3 main.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend
echo -e "${GREEN}Starting Next.js frontend...${NC}"
cd prompt-editor || exit 1
pnpm dev &
FRONTEND_PID=$!

# Wait for user to stop the script
echo -e "${BLUE}✅ Both servers are running!${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
wait