"""MCP Server module for Phase 3 chatbot functionality.

This module provides a FastMCP server with task operation tools
that can be called by the AI agent via FastMCP Client.

Usage:
    # Run the server
    python -m src.mcp_server

    # Or from code
    from src.mcp_server.server import mcp, run_server

Server runs on HTTP transport at http://localhost:8001 by default.
Configure port via MCP_SERVER_PORT environment variable.

Available tools:
    - add_task: Create a new task
    - list_tasks: List user's tasks with optional filtering
    - complete_task: Mark a task as completed
    - delete_task: Delete a task
    - update_task: Update task title/description
"""

from src.mcp_server.server import mcp, run_server

__all__ = ["mcp", "run_server"]
