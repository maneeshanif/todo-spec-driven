# Todo App - Backend

FastAPI backend for the Todo Web Application.

## Tech Stack

- **Framework**: FastAPI 0.115+
- **ORM**: SQLModel 0.0.24+
- **Database**: PostgreSQL (via asyncpg)
- **Package Manager**: UV
- **Python Version**: 3.13+
- **Authentication**: Better Auth JWT validation via JWKS endpoint

## Setup

1. **Install Dependencies**:
   ```bash
   uv sync
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Database Migration**:
   ```bash
   alembic upgrade head
   ```

4. **Run Development Server**:
   ```bash
   uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Project Structure

```
backend/
├── src/
│   ├── models/       # SQLModel database models
│   ├── services/     # Business logic
│   ├── api/          # API routes
│   ├── core/         # Configuration, security, dependencies
│   ├── db/           # Database connection
│   ├── middleware/   # Custom middleware
│   └── schemas/      # Pydantic schemas
├── tests/            # Test suites
├── alembic/          # Database migrations
└── pyproject.toml    # Project configuration
```

## Testing

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src

# Run specific test file
uv run pytest tests/unit/test_auth.py
```

## See Also

- [Main README](../README.md)
- [API Specification](../specs/api/)
- [CLAUDE.md](./CLAUDE.md) - Backend-specific agent rules
