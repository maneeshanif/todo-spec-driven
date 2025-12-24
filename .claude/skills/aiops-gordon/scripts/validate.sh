#!/bin/bash
# Docker AI (Gordon) Validation Script

set -e

echo "=== Docker AI (Gordon) Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check Docker installation
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker not installed"
    ERRORS=$((ERRORS + 1))
    exit 1
fi

# Check Docker Desktop version
echo "Checking Docker Desktop version..."
VERSION_OUTPUT=$(docker version --format '{{.Client.Version}}' 2>/dev/null || echo "unknown")
MAJOR_VERSION=$(echo "$VERSION_OUTPUT" | cut -d. -f1)
MINOR_VERSION=$(echo "$VERSION_OUTPUT" | cut -d. -f2)

if [ "$MAJOR_VERSION" -ge 4 ] && [ "$MINOR_VERSION" -ge 35 ] 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Docker Desktop version $VERSION_OUTPUT (AI supported)"
else
    echo -e "${YELLOW}!${NC} Docker Desktop version $VERSION_OUTPUT"
    echo -e "    Docker AI requires version 4.35+"
    WARNINGS=$((WARNINGS + 1))
fi

# Check if Docker daemon is running
echo "Checking Docker daemon..."
if docker info &> /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker daemon running"
else
    echo -e "${RED}✗${NC} Docker daemon not running"
    ERRORS=$((ERRORS + 1))
fi

# Check Docker AI availability
echo "Checking Docker AI availability..."
if docker ai --help &> /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker AI (Gordon) is available"
else
    echo -e "${YELLOW}!${NC} Docker AI not available"
    echo -e "    Enable in Docker Desktop: Settings > Features in development > Docker AI"
    WARNINGS=$((WARNINGS + 1))
fi

# Check network connectivity (required for AI)
echo "Checking network connectivity..."
if ping -c 1 docker.com &> /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Network connectivity OK"
else
    echo -e "${YELLOW}!${NC} Network connectivity issues"
    echo -e "    Docker AI requires internet access"
    WARNINGS=$((WARNINGS + 1))
fi

# Test Docker AI with simple query
echo "Testing Docker AI..."
if docker ai --help &> /dev/null 2>&1; then
    # Try a simple query with timeout
    RESPONSE=$(timeout 30 docker ai "What is Docker?" 2>&1 || echo "timeout")
    if [ "$RESPONSE" != "timeout" ] && [ -n "$RESPONSE" ]; then
        echo -e "${GREEN}✓${NC} Docker AI responding to queries"
    else
        echo -e "${YELLOW}!${NC} Docker AI not responding (may need to enable)"
    fi
fi

# Check for Dockerfile to review
echo ""
echo "Checking project files for AI review..."
if [ -f "Dockerfile" ] || [ -f "backend/Dockerfile" ] || [ -f "frontend/Dockerfile" ]; then
    echo -e "${GREEN}✓${NC} Found Dockerfiles for AI review"
else
    echo -e "${YELLOW}!${NC} No Dockerfiles found in common locations"
fi

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ] || [ -f "compose.yml" ]; then
    echo -e "${GREEN}✓${NC} Found Docker Compose files for AI review"
else
    echo -e "${YELLOW}!${NC} No Docker Compose files found"
fi

# Summary
echo ""
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Docker AI is ready to use.${NC}"
    echo ""
    echo "Try: docker ai \"How do I optimize my Dockerfile?\""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s), 0 errors${NC}"
    echo ""
    echo "Docker AI may work with limited functionality."
    exit 0
else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
