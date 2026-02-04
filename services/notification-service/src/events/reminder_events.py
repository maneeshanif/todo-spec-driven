"""Reminder event handlers for Notification Service."""
from dapr.ext.fastapi import DaprApp

from .consumer import register_subscriptions

__all__ = ["register_subscriptions"]
