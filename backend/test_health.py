#!/usr/bin/env python
"""Test health endpoint for MCP server.

This script tests if the /health endpoint is accessible on the MCP server.
"""
import httpx
import sys
import time


def test_health_endpoint():
    """Test the /health endpoint."""
    port = 8001
    url = f"http://localhost:{port}/health"

    print(f"Testing health endpoint at {url}")
    print("Make sure the MCP server is running first!")
    print("Start it with: cd backend && uv run python -m src.mcp_server.server")
    print()

    try:
        response = httpx.get(url, timeout=5.0)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                print("\n✓ Health check passed!")
                return 0
            else:
                print("\n✗ Health check returned non-healthy status")
                return 1
        else:
            print(f"\n✗ Health check failed with status {response.status_code}")
            return 1

    except httpx.ConnectError:
        print("\n✗ Could not connect to MCP server")
        print("Make sure the server is running on port 8001")
        return 1
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(test_health_endpoint())
