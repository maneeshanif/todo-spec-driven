# GitHub Actions CI/CD Examples

## Example 1: Backend Testing Job

```yaml
# .github/workflows/ci.yaml (backend-test job)
backend-test:
  name: Backend Tests
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: ./backend

  services:
    postgres:
      image: postgres:16-alpine
      env:
        POSTGRES_USER: test
        POSTGRES_PASSWORD: test
        POSTGRES_DB: todo_test
      ports:
        - 5432:5432
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

    redis:
      image: redis:7-alpine
      ports:
        - 6379:6379
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - uses: actions/checkout@v4

    - name: Install uv
      uses: astral-sh/setup-uv@v4
      with:
        version: "latest"

    - name: Set up Python
      run: uv python install 3.13

    - name: Install dependencies
      run: uv sync --frozen

    - name: Run linting
      run: uv run ruff check .

    - name: Run type checking
      run: uv run mypy src/

    - name: Run tests with coverage
      env:
        DATABASE_URL: postgresql://test:test@localhost:5432/todo_test
        REDIS_URL: redis://localhost:6379
        BETTER_AUTH_SECRET: test-secret
        GEMINI_API_KEY: test-key
      run: |
        uv run pytest tests/ -v \
          --cov=src \
          --cov-report=xml \
          --cov-report=html

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: ./backend/coverage.xml
        flags: backend
        token: ${{ secrets.CODECOV_TOKEN }}
```

## Example 2: Frontend Testing Job

```yaml
# .github/workflows/ci.yaml (frontend-test job)
frontend-test:
  name: Frontend Tests
  runs-on: ubuntu-latest
  defaults:
    run:
      working-directory: ./frontend

  steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: './frontend/package-lock.json'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run unit tests
      run: npm test -- --coverage --watchAll=false

    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_API_URL: http://localhost:8000
        NEXT_PUBLIC_WS_URL: ws://localhost:8005

    - name: Upload coverage
      uses: codecov/codecov-action@v4
      with:
        files: ./frontend/coverage/lcov.info
        flags: frontend
```

## Example 3: Docker Build Matrix

```yaml
# .github/workflows/ci.yaml (build-images job)
build-images:
  name: Build Docker Images
  runs-on: ubuntu-latest
  needs: [backend-test, frontend-test]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'

  permissions:
    contents: read
    packages: write

  strategy:
    matrix:
      include:
        - name: backend
          context: ./backend
          dockerfile: ./backend/Dockerfile
        - name: frontend
          context: ./frontend
          dockerfile: ./frontend/Dockerfile
        - name: notification-service
          context: ./services/notification
          dockerfile: ./services/notification/Dockerfile
        - name: recurring-service
          context: ./services/recurring
          dockerfile: ./services/recurring/Dockerfile
        - name: websocket-service
          context: ./services/websocket
          dockerfile: ./services/websocket/Dockerfile

  steps:
    - uses: actions/checkout@v4

    - name: Set up QEMU
      uses: docker/setup-qemu-action@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ghcr.io/${{ github.repository }}/${{ matrix.name }}
        tags: |
          type=sha,prefix=
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: ${{ matrix.context }}
        file: ${{ matrix.dockerfile }}
        platforms: linux/amd64,linux/arm64
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
```

## Example 4: Staging Deployment

```yaml
# .github/workflows/cd-staging.yaml
name: CD Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  CLUSTER_NAME: todo-staging
  NAMESPACE: todo-staging

jobs:
  deploy:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Save kubeconfig
        run: doctl kubernetes cluster kubeconfig save ${{ env.CLUSTER_NAME }}

      - name: Set up Helm
        uses: azure/setup-helm@v4
        with:
          version: v3.14.0

      - name: Create namespace
        run: kubectl create namespace ${{ env.NAMESPACE }} --dry-run=client -o yaml | kubectl apply -f -

      - name: Deploy with Helm
        run: |
          helm upgrade --install evolution-todo ./helm/evolution-todo \
            --namespace ${{ env.NAMESPACE }} \
            --values ./helm/evolution-todo/values-staging.yaml \
            --set global.image.tag=${{ github.sha }} \
            --set backend.secrets.databaseUrl=${{ secrets.STAGING_DATABASE_URL }} \
            --set backend.secrets.geminiApiKey=${{ secrets.GEMINI_API_KEY }} \
            --set backend.secrets.betterAuthSecret=${{ secrets.BETTER_AUTH_SECRET }} \
            --wait \
            --timeout 10m

      - name: Verify deployment
        run: |
          kubectl rollout status deployment/backend -n ${{ env.NAMESPACE }} --timeout=5m
          kubectl rollout status deployment/frontend -n ${{ env.NAMESPACE }} --timeout=5m

      - name: Run smoke tests
        run: |
          BACKEND_URL=$(kubectl get svc backend -n ${{ env.NAMESPACE }} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
          curl -f http://$BACKEND_URL:8000/health || exit 1
```

## Example 5: Production Deployment with Approval

```yaml
# .github/workflows/cd-production.yaml
name: CD Production

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

env:
  CLUSTER_NAME: todo-production
  NAMESPACE: todo-app

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment: production  # Requires approval

    steps:
      - uses: actions/checkout@v4

      - name: Determine version
        id: version
        run: |
          if [ "${{ github.event_name }}" == "release" ]; then
            echo "version=${{ github.event.release.tag_name }}" >> $GITHUB_OUTPUT
          else
            echo "version=${{ github.event.inputs.version }}" >> $GITHUB_OUTPUT
          fi

      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - name: Save kubeconfig
        run: doctl kubernetes cluster kubeconfig save ${{ env.CLUSTER_NAME }}

      - name: Set up Helm
        uses: azure/setup-helm@v4

      - name: Deploy with Helm
        run: |
          helm upgrade --install evolution-todo ./helm/evolution-todo \
            --namespace ${{ env.NAMESPACE }} \
            --values ./helm/evolution-todo/values-production.yaml \
            --set global.image.tag=${{ steps.version.outputs.version }} \
            --set backend.secrets.databaseUrl=${{ secrets.PROD_DATABASE_URL }} \
            --set backend.secrets.geminiApiKey=${{ secrets.GEMINI_API_KEY }} \
            --set backend.secrets.betterAuthSecret=${{ secrets.BETTER_AUTH_SECRET }} \
            --set kafka.brokers=${{ secrets.REDPANDA_BROKERS }} \
            --wait \
            --timeout 15m

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "✅ *Production Deployment Successful*\n\n*Version:* ${{ steps.version.outputs.version }}\n*Deployed by:* ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

      - name: Rollback on failure
        if: failure()
        run: |
          echo "Deployment failed, rolling back..."
          helm rollback evolution-todo -n ${{ env.NAMESPACE }}
```

## Example 6: Security Scanning

```yaml
# .github/workflows/security.yaml
name: Security Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  trivy-repo:
    name: Trivy Repository Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-repo-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-repo-results.sarif'

  trivy-images:
    name: Trivy Image Scan
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    strategy:
      matrix:
        image: [backend, frontend, notification-service]
    steps:
      - name: Run Trivy image scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'ghcr.io/${{ github.repository }}/${{ matrix.image }}:latest'
          format: 'sarif'
          output: 'trivy-${{ matrix.image }}.sarif'

      - name: Upload results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-${{ matrix.image }}.sarif'

  dependency-review:
    name: Dependency Review
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
```

## Example 7: Reusable Workflow

```yaml
# .github/workflows/reusable-deploy.yaml
name: Reusable Deploy

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      namespace:
        required: true
        type: string
      values-file:
        required: true
        type: string
    secrets:
      DIGITALOCEAN_ACCESS_TOKEN:
        required: true
      DATABASE_URL:
        required: true
      GEMINI_API_KEY:
        required: true
      BETTER_AUTH_SECRET:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}

      - run: doctl kubernetes cluster kubeconfig save todo-${{ inputs.environment }}

      - uses: azure/setup-helm@v4

      - name: Deploy
        run: |
          helm upgrade --install evolution-todo ./helm/evolution-todo \
            --namespace ${{ inputs.namespace }} \
            --values ./helm/evolution-todo/${{ inputs.values-file }} \
            --set backend.secrets.databaseUrl=${{ secrets.DATABASE_URL }} \
            --set backend.secrets.geminiApiKey=${{ secrets.GEMINI_API_KEY }} \
            --wait

# Usage in another workflow:
# jobs:
#   deploy-staging:
#     uses: ./.github/workflows/reusable-deploy.yaml
#     with:
#       environment: staging
#       namespace: todo-staging
#       values-file: values-staging.yaml
#     secrets: inherit
```
