# Multi-stage Dockerfile for Recurring Task Service
FROM python:3.13-slim AS builder

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./

RUN uv venv && uv sync --frozen --no-dev

FROM python:3.13-slim

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8003

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8003"]
