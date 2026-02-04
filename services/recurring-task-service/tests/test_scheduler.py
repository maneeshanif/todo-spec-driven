"""
Unit tests for RecurringTaskScheduler
"""
import pytest
from datetime import datetime
from src.scheduler import RecurringTaskScheduler


class TestRecurringTaskScheduler:
    """Test suite for RecurringTaskScheduler class."""

    @pytest.fixture
    def scheduler(self):
        """Create scheduler instance for testing."""
        return RecurringTaskScheduler()

    def test_calculate_next_occurrence_daily(self, scheduler):
        """Test daily recurring pattern."""
        current = datetime(2026, 1, 15, 10, 30)
        next_date = scheduler.calculate_next_occurrence(current, "daily")

        assert next_date.year == 2026
        assert next_date.month == 1
        assert next_date.day == 16
        assert next_date.hour == 10
        assert next_date.minute == 30

    def test_calculate_next_occurrence_weekly(self, scheduler):
        """Test weekly recurring pattern."""
        current = datetime(2026, 1, 15, 10, 30)
        next_date = scheduler.calculate_next_occurrence(current, "weekly")

        assert next_date.year == 2026
        assert next_date.month == 1
        assert next_date.day == 22
        assert next_date.hour == 10
        assert next_date.minute == 30

    def test_calculate_next_occurrence_monthly(self, scheduler):
        """Test monthly recurring pattern."""
        current = datetime(2026, 1, 15, 10, 30)
        next_date = scheduler.calculate_next_occurrence(current, "monthly")

        assert next_date.year == 2026
        assert next_date.month == 2
        assert next_date.day == 15
        assert next_date.hour == 10
        assert next_date.minute == 30

    def test_monthly_pattern_handles_month_end(self, scheduler):
        """Test monthly pattern handles month end correctly."""
        # January 31st
        current = datetime(2026, 1, 31, 10, 30)
        next_date = scheduler.calculate_next_occurrence(current, "monthly")

        # Should be February 28th (or 29th in leap year)
        assert next_date.year == 2026
        assert next_date.month == 2
        assert next_date.day == 28  # 2026 is not a leap year
        assert next_date.hour == 10
        assert next_date.minute == 30

    def test_monthly_pattern_handles_leap_year(self, scheduler):
        """Test monthly pattern handles leap year correctly."""
        # February 29th in leap year (2024)
        current = datetime(2024, 2, 29, 10, 30)
        next_date = scheduler.calculate_next_occurrence(current, "monthly")

        # Should be March 29th
        assert next_date.year == 2024
        assert next_date.month == 3
        assert next_date.day == 29
        assert next_date.hour == 10
        assert next_date.minute == 30

    def test_invalid_pattern_raises_error(self, scheduler):
        """Test invalid pattern raises ValueError."""
        current = datetime(2026, 1, 15, 10, 30)

        with pytest.raises(ValueError) as exc_info:
            scheduler.calculate_next_occurrence(current, "hourly")

        assert "Unsupported recurring pattern" in str(exc_info.value)
        assert "hourly" in str(exc_info.value)

    def test_pattern_map_contains_all_patterns(self, scheduler):
        """Test all supported patterns are in PATTERN_MAP."""
        expected_patterns = ["daily", "weekly", "monthly"]
        for pattern in expected_patterns:
            assert pattern in scheduler.PATTERN_MAP

    def test_build_service_invocation_url(self, scheduler):
        """Test Dapr service invocation URL building."""
        url = scheduler._build_service_invocation_url("/api/tasks")

        assert url == f"http://localhost:{scheduler.dapr_http_port}/v1.0/invoke/{scheduler.backend_app_id}/method/api/tasks"
