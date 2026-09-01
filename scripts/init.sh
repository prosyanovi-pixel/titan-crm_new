#!/bin/bash

# TITAN CRM - Script for initializing Node.js dependencies
# Installs dependencies in root, backend, and frontend directories

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     TITAN CRM - Dependencies Installer     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Get the script's directory (project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to install dependencies
# Skips the directory if it does not exist (frontend/backend may be on different machines)
install_deps() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir" ]; then
        echo -e "${YELLOW}[$name]${NC} Directory not found: $dir — skipping"
        echo ""
        return 0
    fi
    
    echo -e "${YELLOW}[$name]${NC} Installing dependencies..."
    
    if [ ! -f "$dir/package.json" ]; then
        echo -e "${RED}[$name]${NC} Error: package.json not found in $dir"
        return 1
    fi
    
    cd "$dir"
    
    if npm install; then
        echo -e "${GREEN}[$name]${NC} Dependencies installed successfully"
    else
        echo -e "${RED}[$name]${NC} Failed to install dependencies"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not available${NC}"
    exit 1
fi

echo -e "Node.js version: ${GREEN}$(node --version)${NC}"
echo -e "npm version: ${GREEN}$(npm --version)${NC}"
echo ""

# Install dependencies in all directories
FAILED=0

# Root dependencies (E2E tests)
install_deps "$PROJECT_ROOT" "ROOT" || FAILED=1

# Backend dependencies
install_deps "$PROJECT_ROOT/backend" "BACKEND" || FAILED=1

# Frontend dependencies
install_deps "$PROJECT_ROOT/frontend" "FRONTEND" || FAILED=1

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}║     All dependencies installed successfully! ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "Next steps:"
    echo -e "  ${YELLOW}Backend:${NC}  cd backend && npm run dev"
    echo -e "  ${YELLOW}Frontend:${NC} cd frontend && npm run dev"
    echo ""
else
    echo -e "${RED}║     Some installations failed!             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Please check the errors above and try again.${NC}"
    exit 1
fi
