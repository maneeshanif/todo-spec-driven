"""Prometheus-compatible metrics collection.

This module provides utilities for collecting and exposing metrics in Prometheus format.

To use with Prometheus, configure a scrape target:
  - job_name: 'todo-api'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/api/metrics'
"""
from collections import defaultdict
from time import time
from typing import Dict, List
import statistics


class MetricsCollector:
    """
    Collect application metrics in Prometheus-compatible format.

    Tracks:
    - Request counts by endpoint and method
    - Response times (p50, p95, p99)
    - Database query times
    - Error rates
    """

    def __init__(self):
        # Request metrics
        self.request_count: Dict[str, int] = defaultdict(int)
        self.request_durations: Dict[str, List[float]] = defaultdict(list)

        # Database metrics
        self.db_query_count: int = 0
        self.db_query_durations: List[float] = []

        # Error metrics
        self.error_count: Dict[int, int] = defaultdict(int)  # By status code

        # Response size metrics
        self.response_sizes: List[int] = []

    def record_request(
        self,
        method: str,
        path: str,
        duration_ms: float,
        status_code: int,
        response_size: int = 0
    ):
        """
        Record a request metric.

        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path
            duration_ms: Request duration in milliseconds
            status_code: HTTP status code
            response_size: Response size in bytes
        """
        # Normalize path (remove IDs)
        normalized_path = self._normalize_path(path)
        key = f"{method}:{normalized_path}"

        # Increment request count
        self.request_count[key] += 1

        # Record duration
        self.request_durations[key].append(duration_ms)

        # Record response size
        if response_size > 0:
            self.response_sizes.append(response_size)

        # Record errors
        if status_code >= 400:
            self.error_count[status_code] += 1

    def record_db_query(self, duration_ms: float):
        """
        Record a database query metric.

        Args:
            duration_ms: Query duration in milliseconds
        """
        self.db_query_count += 1
        self.db_query_durations.append(duration_ms)

    def _normalize_path(self, path: str) -> str:
        """
        Normalize path by replacing IDs with placeholders.

        Examples:
            /api/tasks/123 -> /api/tasks/{id}
            /api/users/456/tasks/789 -> /api/users/{id}/tasks/{id}
        """
        parts = path.split('/')
        normalized = []

        for part in parts:
            # Check if part is a number (likely an ID)
            if part.isdigit():
                normalized.append('{id}')
            else:
                normalized.append(part)

        return '/'.join(normalized)

    def get_percentile(self, values: List[float], percentile: int) -> float:
        """
        Calculate percentile from list of values.

        Args:
            values: List of values
            percentile: Percentile to calculate (50, 95, 99)

        Returns:
            Percentile value
        """
        if not values:
            return 0.0

        sorted_values = sorted(values)
        index = int(len(sorted_values) * (percentile / 100))
        return sorted_values[min(index, len(sorted_values) - 1)]

    def export_prometheus(self) -> str:
        """
        Export metrics in Prometheus text format.

        Returns:
            Metrics in Prometheus exposition format
        """
        lines = []

        # Request count metrics
        lines.append("# HELP http_requests_total Total number of HTTP requests")
        lines.append("# TYPE http_requests_total counter")
        for endpoint, count in self.request_count.items():
            method, path = endpoint.split(':', 1)
            lines.append(
                f'http_requests_total{{method="{method}",path="{path}"}} {count}'
            )

        # Request duration metrics (p50, p95, p99)
        lines.append("")
        lines.append("# HELP http_request_duration_ms HTTP request duration in milliseconds")
        lines.append("# TYPE http_request_duration_ms summary")

        for endpoint, durations in self.request_durations.items():
            method, path = endpoint.split(':', 1)

            p50 = self.get_percentile(durations, 50)
            p95 = self.get_percentile(durations, 95)
            p99 = self.get_percentile(durations, 99)
            count = len(durations)
            total = sum(durations)

            labels = f'method="{method}",path="{path}"'

            lines.append(f'http_request_duration_ms{{quantile="0.5",{labels}}} {p50}')
            lines.append(f'http_request_duration_ms{{quantile="0.95",{labels}}} {p95}')
            lines.append(f'http_request_duration_ms{{quantile="0.99",{labels}}} {p99}')
            lines.append(f'http_request_duration_ms_sum{{{labels}}} {total}')
            lines.append(f'http_request_duration_ms_count{{{labels}}} {count}')

        # Database query metrics
        lines.append("")
        lines.append("# HELP db_queries_total Total number of database queries")
        lines.append("# TYPE db_queries_total counter")
        lines.append(f"db_queries_total {self.db_query_count}")

        if self.db_query_durations:
            lines.append("")
            lines.append("# HELP db_query_duration_ms Database query duration in milliseconds")
            lines.append("# TYPE db_query_duration_ms summary")

            p50 = self.get_percentile(self.db_query_durations, 50)
            p95 = self.get_percentile(self.db_query_durations, 95)
            p99 = self.get_percentile(self.db_query_durations, 99)

            lines.append(f'db_query_duration_ms{{quantile="0.5"}} {p50}')
            lines.append(f'db_query_duration_ms{{quantile="0.95"}} {p95}')
            lines.append(f'db_query_duration_ms{{quantile="0.99"}} {p99}')
            lines.append(f'db_query_duration_ms_sum {sum(self.db_query_durations)}')
            lines.append(f'db_query_duration_ms_count {len(self.db_query_durations)}')

        # Error metrics
        lines.append("")
        lines.append("# HELP http_errors_total Total number of HTTP errors")
        lines.append("# TYPE http_errors_total counter")
        for status_code, count in self.error_count.items():
            lines.append(f'http_errors_total{{status_code="{status_code}"}} {count}')

        # Response size metrics
        if self.response_sizes:
            lines.append("")
            lines.append("# HELP http_response_size_bytes HTTP response size in bytes")
            lines.append("# TYPE http_response_size_bytes summary")

            p50 = self.get_percentile(self.response_sizes, 50)
            p95 = self.get_percentile(self.response_sizes, 95)
            p99 = self.get_percentile(self.response_sizes, 99)

            lines.append(f'http_response_size_bytes{{quantile="0.5"}} {p50}')
            lines.append(f'http_response_size_bytes{{quantile="0.95"}} {p95}')
            lines.append(f'http_response_size_bytes{{quantile="0.99"}} {p99}')
            lines.append(f'http_response_size_bytes_sum {sum(self.response_sizes)}')
            lines.append(f'http_response_size_bytes_count {len(self.response_sizes)}')

        return '\n'.join(lines) + '\n'

    def reset(self):
        """Reset all metrics (useful for testing)."""
        self.request_count.clear()
        self.request_durations.clear()
        self.db_query_count = 0
        self.db_query_durations.clear()
        self.error_count.clear()
        self.response_sizes.clear()


# Global metrics collector instance
metrics_collector = MetricsCollector()
