#!/bin/bash
# Docker Setup Validation Script

set -e

echo "=== Docker Setup Validation ==="
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
fi

# Check Docker daemon
echo "Checking Docker daemon..."
if docker info &> /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker daemon running"
else
    echo -e "${RED}✗${NC} Docker daemon not running"
    ERRORS=$((ERRORS + 1))
fi

# Check Docker Compose
echo "Checking Docker Compose..."
if docker compose version &> /dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version --short)
    echo -e "${GREEN}✓${NC} Docker Compose installed: v$COMPOSE_VERSION"
else
    echo -e "${YELLOW}!${NC} Docker Compose not available"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for Dockerfiles
echo ""
echo "Checking Dockerfiles..."

DOCKERFILES=("Dockerfile" "backend/Dockerfile" "frontend/Dockerfile")
for df in "${DOCKERFILES[@]}"; do
    if [ -f "$df" ]; then
        echo -e "${GREEN}✓${NC} Found: $df"

        # Validate Dockerfile syntax
        if docker build --check -f "$df" . &> /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Syntax valid"
        else
            echo -e "  ${YELLOW}!${NC} Could not validate syntax"
        fi
    else
        echo -e "${YELLOW}!${NC} Not found: $df"
    fi
done

# Check for docker-compose.yml
echo ""
echo "Checking Docker Compose files..."

COMPOSE_FILES=("docker-compose.yml" "docker-compose.yaml" "compose.yml" "compose.yaml")
COMPOSE_FOUND=false
for cf in "${COMPOSE_FILES[@]}"; do
    if [ -f "$cf" ]; then
        echo -e "${GREEN}✓${NC} Found: $cf"
        COMPOSE_FOUND=true

        # Validate compose file
        if docker compose -f "$cf" config &> /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Configuration valid"
        else
            echo -e "  ${RED}✗${NC} Configuration invalid"
            ERRORS=$((ERRORS + 1))
        fi
    fi
done

if [ "$COMPOSE_FOUND" = false ]; then
    echo -e "${YELLOW}!${NC} No Docker Compose file found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for .dockerignore
echo ""
echo "Checking .dockerignore files..."
IGNORE_DIRS=("." "backend" "frontend")
for dir in "${IGNORE_DIRS[@]}"; do
    if [ -f "$dir/.dockerignore" ]; then
        echo -e "${GREEN}✓${NC} Found: $dir/.dockerignore"
    else
        echo -e "${YELLOW}!${NC} Missing: $dir/.dockerignore"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# Check for environment files
echo ""
echo "Checking environment files..."
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓${NC} Found .env.example"
else
    echo -e "${YELLOW}!${NC} Missing .env.example"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Found .env"

    # Check for required variables
    REQUIRED_VARS=("DATABASE_URL" "BETTER_AUTH_SECRET")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            echo -e "  ${GREEN}✓${NC} $var defined"
        else
            echo -e "  ${YELLOW}!${NC} $var not defined in .env"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${YELLOW}!${NC} Missing .env (copy from .env.example)"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "=== Validation Summary ==="
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}$WARNINGS warning(s), 0 errors${NC}"
    exit 0
else
    echo -e "${RED}$ERRORS error(s), $WARNINGS warning(s)${NC}"
    exit 1
fi
