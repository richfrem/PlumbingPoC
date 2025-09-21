u#!/bin/bash
# E2E Test Runner Script
# Starts the application and runs E2E tests automatically
# Usage: ./test-e2e.sh [--headed] [--test-pattern "pattern"] [--help]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
HEADED=false
TEST_PATTERN=""
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      HEADED=true
      shift
      ;;
    --test-pattern)
        TEST_PATTERN="$2"
        shift 2
        ;;
      --help|-h)
        HELP=true
        shift
        ;;
      *)
        echo -e "${RED}Unknown option: $1${NC}"
        HELP=true
        shift
        ;;
    esac
  done
  
  # Show help
  if [[ "$HELP" == true ]]; then
    echo "E2E Test Runner Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "This script starts the PlumbingPOC application and runs E2E tests automatically."
    echo ""
    echo "Options:"
    echo "  --headed          Run tests in headed mode (visible browser)"
    echo "  --test-pattern    Run specific test suite (see patterns below)"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Test Patterns:"
    echo "  auth              Run authentication tests (specs/auth/)"
    echo "  single-auth       Run your specific sign-in test only"
    echo "  user-journeys     Run user journey tests (specs/user-journeys/)"
    echo "  admin-journeys    Run admin journey tests (specs/admin-journeys/)"
    echo "  integration       Run integration tests (specs/integration/)"
    echo "  core              Run core functionality test"
    echo "  all-auth          Run all authentication tests"
    echo "  all-user          Run all user journey tests"
    echo "  all-admin         Run all admin journey tests"
    echo "  all-integration   Run all integration tests"
    echo "  [custom pattern]  Use grep to match test names"
    echo ""
    echo "Examples:"
    echo "  $0                           # Run all E2E tests headlessly"
    echo "  $0 --headed                 # Run all E2E tests with visible browser"
    echo "  $0 --test-pattern auth      # Run authentication tests"
    echo "  $0 --test-pattern core      # Run core functionality test"
    echo "  $0 --test-pattern 'should sign in, wait 10 seconds'  # Custom grep pattern"
    echo ""
    exit 0
  fi

echo -e "${BLUE}🚀 Starting PlumbingPOC E2E Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

# Check if required files exist
if [ ! -f "startup.sh" ]; then
  echo -e "${RED}❌ startup.sh not found in current directory${NC}"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo -e "${RED}❌ package.json not found. Are you in the project root?${NC}"
  exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  .env file not found. Some tests may fail without proper credentials.${NC}"
fi

# Function to cleanup background processes
cleanup() {
  echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"

  # Only kill application processes if we started them
  if [[ -n "$STARTUP_PID" ]]; then
    echo -e "${BLUE}Stopping application (PID: $STARTUP_PID)...${NC}"
    kill "$STARTUP_PID" 2>/dev/null || true

    # Give it a moment to shut down gracefully
    sleep 2

    # Kill any remaining processes we started
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    pkill -f "node api/server.js" 2>/dev/null || true
  else
    echo -e "${BLUE}Application was already running - not stopping it${NC}"
  fi

  # Always kill Playwright processes (we started these)
  pkill -f "playwright" 2>/dev/null || true

  echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Check if application is already running
echo -e "${BLUE}🔍 Checking if application is already running...${NC}"

BACKEND_RUNNING=false
FRONTEND_RUNNING=false

# Check backend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Backend already running on port 3000"
  BACKEND_RUNNING=true
else
  echo -e "${YELLOW}⋯${NC} Backend not running on port 3000"
fi

# Check frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Frontend already running on port 5173"
  FRONTEND_RUNNING=true
else
  echo -e "${YELLOW}⋯${NC} Frontend not running on port 5173"
fi

# Start application only if needed
if [[ "$BACKEND_RUNNING" == true && "$FRONTEND_RUNNING" == true ]]; then
  echo -e "${GREEN}🎉 Application already running - skipping startup${NC}"
  STARTUP_PID=""
else
  echo -e "${BLUE}📦 Starting application with startup.sh...${NC}"
  ./startup.sh &
  STARTUP_PID=$!
fi

# Wait for application to be ready (only if we started it)
if [[ -n "$STARTUP_PID" ]]; then
  echo -e "${BLUE}⏳ Waiting for application to be ready...${NC}"

  # Wait for backend
  echo -e "${BLUE}⋯${NC} Waiting for backend (port 3000)..."
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Backend ready on port 3000"
      break
    fi
    echo -e "${BLUE}⋯${NC} Attempt $i/30 - Backend not ready yet..."
    sleep 2
  done

  # Wait for frontend
  echo -e "${BLUE}⋯${NC} Waiting for frontend (port 5173)..."
  for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
      echo -e "${GREEN}✓${NC} Frontend ready on port 5173"
      break
    fi
    echo -e "${BLUE}⋯${NC} Attempt $i/30 - Frontend not ready yet..."
    sleep 2
  done

  # Give a moment for everything to stabilize
  sleep 3
else
  echo -e "${GREEN}🎉 Using already running application${NC}"
fi

# Run E2E tests
echo -e "${BLUE}🧪 Running E2E tests...${NC}"

# Build playwright command
CMD="npx playwright test"

if [[ "$HEADED" == true ]]; then
  CMD="$CMD --headed"
fi

# Handle test pattern selection based on folder structure
if [[ -n "$TEST_PATTERN" ]]; then
  case "$TEST_PATTERN" in
    "auth"|"authentication")
      CMD="$CMD specs/auth/"
      ;;
    "user-journeys"|"user"|"journeys")
      CMD="$CMD specs/user-journeys/"
      ;;
    "admin-journeys"|"admin")
      CMD="$CMD specs/admin-journeys/"
      ;;
    "integration"|"realtime")
      CMD="$CMD specs/integration/"
      ;;
    "core"|"basic")
      CMD="$CMD specs/user-journeys/core-functionality.spec.ts"
      ;;
    "single-auth")
      CMD="$CMD specs/auth/authentication.spec.ts --grep \"should sign in, wait 10 seconds\""
      ;;
    "all-auth")
      CMD="$CMD specs/auth/"
      ;;
    "all-user")
      CMD="$CMD specs/user-journeys/"
      ;;
    "all-admin")
      CMD="$CMD specs/admin-journeys/"
      ;;
    "all-integration")
      CMD="$CMD specs/integration/"
      ;;
    *)
      # Default to grep pattern matching for custom patterns
      CMD="$CMD --grep \"$TEST_PATTERN\""
      ;;
  esac
fi

echo -e "${BLUE}Running: $CMD${NC}"

# Execute the tests
if eval "$CMD"; then
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}❌ Some E2E tests failed${NC}"
  EXIT_CODE=1
fi

# Generate test report
echo -e "${BLUE}📊 Generating test report...${NC}"
npx playwright show-report

echo -e "${BLUE}🎉 E2E test run complete!${NC}"

exit $EXIT_CODE