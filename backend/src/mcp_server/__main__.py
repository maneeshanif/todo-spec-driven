"""MCP Server entry point.

Run with: python -m src.mcp_server

This starts the FastMCP server with HTTP transport on port 8001 (or configured MCP_SERVER_PORT).
The server provides task operation tools for the AI agent.

Server URL: http://localhost:8001 (no path parameter needed for HTTP transport)

Available tools:
    - add_task: Create a new task
    - list_tasks: List user's tasks with optional filtering
    - complete_task: Mark a task as completed
    - delete_task: Delete a task
    - update_task: Update task title/description
"""

from src.mcp_server.server import run_server

if __name__ == "__main__":
    run_server()
