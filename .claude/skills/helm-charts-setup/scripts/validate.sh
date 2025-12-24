#!/bin/bash
# Helm Charts Validation Script

set -e

echo "=== Helm Charts Validation ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check Helm installation
echo "Checking Helm installation..."
if command -v helm &> /dev/null; then
    HELM_VERSION=$(helm version --short 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Helm installed: $HELM_VERSION"
else
    echo -e "${RED}✗${NC} Helm not installed"
    ERRORS=$((ERRORS + 1))
fi

# Check for Helm chart directories
echo ""
echo "Checking for Helm charts..."

CHART_DIRS=("helm" "charts" "deploy/helm")
CHART_FOUND=false

for dir in "${CHART_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} Found charts directory: $dir"
        CHART_FOUND=true

        # Find Chart.yaml files
        for chart in $(find "$dir" -name "Chart.yaml" -type f 2>/dev/null); do
            CHART_DIR=$(dirname "$chart")
            CHART_NAME=$(grep "^name:" "$chart" | awk '{print $2}')
            echo -e "  ${GREEN}✓${NC} Found chart: $CHART_NAME ($CHART_DIR)"

            # Lint chart
            if helm lint "$CHART_DIR" &> /dev/null 2>&1; then
                echo -e "    ${GREEN}✓${NC} Lint passed"
            else
                echo -e "    ${RED}✗${NC} Lint failed"
                ERRORS=$((ERRORS + 1))
            fi

            # Check required files
            if [ -f "$CHART_DIR/values.yaml" ]; then
                echo -e "    ${GREEN}✓${NC} values.yaml exists"
            else
                echo -e "    ${YELLOW}!${NC} values.yaml missing"
                WARNINGS=$((WARNINGS + 1))
            fi

            if [ -d "$CHART_DIR/templates" ]; then
                TEMPLATE_COUNT=$(find "$CHART_DIR/templates" -name "*.yaml" -o -name "*.tpl" 2>/dev/null | wc -l)
                echo -e "    ${GREEN}✓${NC} Templates found: $TEMPLATE_COUNT files"
            else
                echo -e "    ${YELLOW}!${NC} templates/ directory missing"
                WARNINGS=$((WARNINGS + 1))
            fi

            # Check for helpers
            if [ -f "$CHART_DIR/templates/_helpers.tpl" ]; then
                echo -e "    ${GREEN}✓${NC} _helpers.tpl exists"
            else
                echo -e "    ${YELLOW}!${NC} _helpers.tpl missing"
                WARNINGS=$((WARNINGS + 1))
            fi

            # Try template rendering
            if helm template test "$CHART_DIR" &> /dev/null 2>&1; then
                echo -e "    ${GREEN}✓${NC} Template renders successfully"
            else
                echo -e "    ${YELLOW}!${NC} Template rendering issues (may need values)"
            fi
        done
    fi
done

if [ "$CHART_FOUND" = false ]; then
    echo -e "${YELLOW}!${NC} No Helm chart directory found"
    WARNINGS=$((WARNINGS + 1))
fi

# Check for values files
echo ""
echo "Checking values files..."

VALUES_FILES=(
    "values.yaml"
    "values-dev.yaml"
    "values-staging.yaml"
    "values-prod.yaml"
    "values-production.yaml"
)

for dir in "${CHART_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        for vf in "${VALUES_FILES[@]}"; do
            if find "$dir" -name "$vf" -type f 2>/dev/null | grep -q .; then
                echo -e "${GREEN}✓${NC} Found: $vf"
            fi
        done
    fi
done

# Check kubectl for dry-run validation
echo ""
echo "Checking template validation..."
if command -v kubectl &> /dev/null; then
    for dir in "${CHART_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            for chart in $(find "$dir" -name "Chart.yaml" -type f 2>/dev/null | head -1); do
                CHART_DIR=$(dirname "$chart")
                if helm template test "$CHART_DIR" 2>/dev/null | kubectl apply --dry-run=client -f - &> /dev/null 2>&1; then
                    echo -e "${GREEN}✓${NC} Templates validate against Kubernetes API"
                else
                    echo -e "${YELLOW}!${NC} Template validation needs values or cluster"
                fi
                break
            done
        fi
    done
else
    echo -e "${YELLOW}!${NC} kubectl not available for validation"
fi

# Check for dependencies
echo ""
echo "Checking chart dependencies..."
for dir in "${CHART_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        for chart in $(find "$dir" -name "Chart.yaml" -type f 2>/dev/null); do
            CHART_DIR=$(dirname "$chart")
            if [ -f "$CHART_DIR/Chart.lock" ]; then
                echo -e "${GREEN}✓${NC} Dependencies locked: $CHART_DIR"
            elif grep -q "dependencies:" "$chart" 2>/dev/null; then
                echo -e "${YELLOW}!${NC} Dependencies defined but not locked: $CHART_DIR"
                echo -e "      Run: helm dependency update $CHART_DIR"
                WARNINGS=$((WARNINGS + 1))
            fi
        done
    fi
done

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
