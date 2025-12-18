"""Script entry points for the backend application.

These functions are entry points defined in pyproject.toml [project.scripts].
They allow running the servers via: uv run <script-name>

Usage:
    uv run api    - Start FastAPI development server on port 8000
    uv run mcp    - Start MCP server on port 8001
"""

import subprocess
import sys


def run_api():
    """Run the FastAPI development server.

    Starts uvicorn with auto-reload on http://0.0.0.0:8000
    """
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "src.main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])


def run_mcp():
    """Run the MCP server for AI agent tools.

    Starts the FastMCP server on http://0.0.0.0:8001/mcp
    """
    subprocess.run([sys.executable, "-m", "src.mcp_server"])


if __name__ == "__main__":
    # Allow direct execution for testing
    import argparse
    parser = argparse.ArgumentParser(description="Backend server scripts")
    parser.add_argument("command", choices=["api", "mcp"], help="Server to run")
    args = parser.parse_args()

    if args.command == "api":
        run_api()
    elif args.command == "mcp":
        run_mcp()
