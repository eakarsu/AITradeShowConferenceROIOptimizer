#!/bin/bash

# AI Trade Show & Conference ROI Optimizer - Start Script
# This script sets up and starts the entire application

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   ${CYAN}AI Trade Show & Conference ROI Optimizer${PURPLE}              ║${NC}"
echo -e "${PURPLE}║   ${YELLOW}Starting Application...${PURPLE}                               ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}[✓]${NC} Environment variables loaded"
else
  echo -e "${RED}[✗]${NC} .env file not found! Please create one."
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-5173}

# Function to kill process on a port
kill_port() {
  local port=$1
  local pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "${YELLOW}[!]${NC} Killing process on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
    sleep 1
  fi
}

# Clean up used ports
echo -e "\n${BLUE}[1/6]${NC} Cleaning up ports..."
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}[✓]${NC} Ports $BACKEND_PORT and $FRONTEND_PORT are free"

# Check PostgreSQL
echo -e "\n${BLUE}[2/6]${NC} Checking PostgreSQL..."
if command -v pg_isready &> /dev/null; then
  if pg_isready -q; then
    echo -e "${GREEN}[✓]${NC} PostgreSQL is running"
  else
    echo -e "${YELLOW}[!]${NC} Starting PostgreSQL..."
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
  fi
else
  echo -e "${YELLOW}[!]${NC} pg_isready not found, assuming PostgreSQL is running"
fi

# Create database if it doesn't exist
echo -e "\n${BLUE}[3/6]${NC} Setting up database..."
DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
createdb "$DB_NAME" 2>/dev/null && echo -e "${GREEN}[✓]${NC} Database '$DB_NAME' created" || echo -e "${GREEN}[✓]${NC} Database '$DB_NAME' already exists"

# Install dependencies
echo -e "\n${BLUE}[4/6]${NC} Installing dependencies..."
cd "$PROJECT_DIR/backend"
if [ ! -d "node_modules" ]; then
  npm install --silent
  echo -e "${GREEN}[✓]${NC} Backend dependencies installed"
else
  echo -e "${GREEN}[✓]${NC} Backend dependencies already installed"
fi

cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  npm install --silent
  echo -e "${GREEN}[✓]${NC} Frontend dependencies installed"
else
  echo -e "${GREEN}[✓]${NC} Frontend dependencies already installed"
fi

# Seed database
echo -e "\n${BLUE}[5/6]${NC} Seeding database..."
cd "$PROJECT_DIR/backend"
node seed.js
echo -e "${GREEN}[✓]${NC} Database seeded with sample data"

# Start application
echo -e "\n${BLUE}[6/6]${NC} Starting application servers..."
echo ""

# Function to handle cleanup on exit
cleanup() {
  echo -e "\n\n${YELLOW}Shutting down...${NC}"
  kill_port $BACKEND_PORT
  kill_port $FRONTEND_PORT
  exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend with nodemon for hot reload
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo -e "${GREEN}[✓]${NC} Backend starting on port $BACKEND_PORT (with hot reload)"

# Start frontend with Vite (has built-in hot reload)
cd "$PROJECT_DIR/frontend"
npx vite --host &
FRONTEND_PID=$!
echo -e "${GREEN}[✓]${NC} Frontend starting on port $FRONTEND_PORT (with hot reload)"

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║   ${GREEN}Application is ready!${PURPLE}                                 ║${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}║   ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT${PURPLE}                    ║${NC}"
echo -e "${PURPLE}║   ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT${PURPLE}                       ║${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}║   ${YELLOW}Login:${NC}     admin@tradeshow.com / password123${PURPLE}        ║${NC}"
echo -e "${PURPLE}║                                                          ║${NC}"
echo -e "${PURPLE}║   ${YELLOW}Press Ctrl+C to stop${PURPLE}                                   ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
