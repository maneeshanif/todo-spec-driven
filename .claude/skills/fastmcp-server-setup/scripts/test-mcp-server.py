#!/usr/bin/env python3
"""
Test script for FastMCP server.
Run this to verify the MCP server is working correctly.

Usage:
    # First start the MCP server:
    cd backend && uv run python -m src.mcp_server.server

    # Then run this test:
    python .claude/skills/fastmcp-server-setup/scripts/test-mcp-server.py
"""

import os
import sys
import asyncio
from pathlib import Path


def print_status(check: str, passed: bool, details: str = ""):
    """Print status with emoji indicator."""
    emoji = "✅" if passed else "❌"
    print(f"{emoji} {check}")
    if details:
        print(f"   └─ {details}")


def check_packages() -> bool:
    """Check required packages are installed."""
    print("\n📦 Checking Required Packages...")

    packages = [
        ("fastmcp", "fastmcp"),
        ("sqlmodel", "sqlmodel"),
    ]

    all_passed = True

    for module, package_name in packages:
        try:
            __import__(module)
            print_status(f"{package_name}", True)
        except ImportError:
            print_status(f"{package_name}", False, f"Install with: uv add {package_name}")
            all_passed = False

    return all_passed


def check_server_file() -> bool:
    """Check the MCP server file exists."""
    print("\n📁 Checking Server File...")

    backend_path = Path.cwd()
    if backend_path.name != "backend":
        backend_path = Path.cwd() / "backend"

    server_path = backend_path / "src" / "mcp_server" / "server.py"

    if server_path.exists():
        print_status("server.py", True, str(server_path))
        return True
    else:
        print_status("server.py", False, f"Expected at: {server_path}")
        return False


async def check_server_connection() -> bool:
    """Test connection to MCP server."""
    print("\n🔌 Testing Server Connection...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            # Ping the server
            await client.ping()
            print_status("Server ping", True, f"URL: {mcp_url}")
            return True

    except Exception as e:
        print_status("Server connection", False, str(e)[:80])
        print(f"   └─ Make sure MCP server is running at {mcp_url}")
        return False


async def check_tools() -> bool:
    """Check that all expected tools are available."""
    print("\n🔧 Checking Available Tools...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            tools = await client.list_tools()
            tool_names = [t.name for t in tools]

            print(f"   Found {len(tools)} tools:")
            for tool in tools:
                print(f"   • {tool.name}: {tool.description[:50]}...")

            # Check for expected tools
            expected_tools = ["add_task", "list_tasks", "complete_task", "delete_task", "update_task"]
            missing = [t for t in expected_tools if t not in tool_names]

            if missing:
                print_status("Expected tools", False, f"Missing: {', '.join(missing)}")
                return False
            else:
                print_status("Expected tools", True, "All 5 task tools present")
                return True

    except Exception as e:
        print_status("List tools", False, str(e)[:80])
        return False


async def test_add_task() -> tuple[bool, dict | None]:
    """Test the add_task tool."""
    print("\n📝 Testing add_task...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")
    test_user_id = "test-user-" + str(asyncio.get_event_loop().time())[:10]

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            result = await client.call_tool(
                "add_task",
                {
                    "user_id": test_user_id,
                    "title": "Test task from validation script",
                    "description": "This is a test task"
                }
            )

            # Check result
            if hasattr(result, 'data'):
                data = result.data
            else:
                data = result

            print(f"   Result: {data}")

            if isinstance(data, dict) and data.get("status") == "created":
                print_status("add_task", True, f"Task ID: {data.get('task_id')}")
                return True, {"user_id": test_user_id, "task_id": data.get("task_id")}
            else:
                print_status("add_task", False, "Unexpected response")
                return False, None

    except Exception as e:
        print_status("add_task", False, str(e)[:80])
        return False, None


async def test_list_tasks(test_data: dict) -> bool:
    """Test the list_tasks tool."""
    print("\n📋 Testing list_tasks...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            result = await client.call_tool(
                "list_tasks",
                {
                    "user_id": test_data["user_id"],
                    "status": "all"
                }
            )

            if hasattr(result, 'data'):
                data = result.data
            else:
                data = result

            print(f"   Result: {data}")

            if isinstance(data, list):
                print_status("list_tasks", True, f"Found {len(data)} task(s)")
                return True
            else:
                print_status("list_tasks", False, "Expected list response")
                return False

    except Exception as e:
        print_status("list_tasks", False, str(e)[:80])
        return False


async def test_complete_task(test_data: dict) -> bool:
    """Test the complete_task tool."""
    print("\n✅ Testing complete_task...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            result = await client.call_tool(
                "complete_task",
                {
                    "user_id": test_data["user_id"],
                    "task_id": test_data["task_id"]
                }
            )

            if hasattr(result, 'data'):
                data = result.data
            else:
                data = result

            print(f"   Result: {data}")

            if isinstance(data, dict) and data.get("status") == "completed":
                print_status("complete_task", True)
                return True
            else:
                print_status("complete_task", False, "Unexpected response")
                return False

    except Exception as e:
        print_status("complete_task", False, str(e)[:80])
        return False


async def test_delete_task(test_data: dict) -> bool:
    """Test the delete_task tool (cleanup)."""
    print("\n🗑️  Testing delete_task...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            result = await client.call_tool(
                "delete_task",
                {
                    "user_id": test_data["user_id"],
                    "task_id": test_data["task_id"]
                }
            )

            if hasattr(result, 'data'):
                data = result.data
            else:
                data = result

            print(f"   Result: {data}")

            if isinstance(data, dict) and data.get("status") == "deleted":
                print_status("delete_task", True, "Test task cleaned up")
                return True
            else:
                print_status("delete_task", False, "Unexpected response")
                return False

    except Exception as e:
        print_status("delete_task", False, str(e)[:80])
        return False


async def main():
    """Run all tests."""
    print("=" * 60)
    print("🔍 FastMCP Server Test Suite")
    print("=" * 60)

    results = {}

    # Package checks
    results["packages"] = check_packages()
    results["server_file"] = check_server_file()

    if not results["packages"]:
        print("\n⚠️  Missing packages. Install them and try again.")
        return 1

    # Connection check
    results["connection"] = await check_server_connection()

    if not results["connection"]:
        print("\n⚠️  Cannot connect to server. Make sure it's running:")
        print("    cd backend && uv run python -m src.mcp_server.server")
        return 1

    # Tool checks
    results["tools_list"] = await check_tools()

    # Tool operation tests
    add_passed, test_data = await test_add_task()
    results["add_task"] = add_passed

    if add_passed and test_data:
        results["list_tasks"] = await test_list_tasks(test_data)
        results["complete_task"] = await test_complete_task(test_data)
        results["delete_task"] = await test_delete_task(test_data)
    else:
        results["list_tasks"] = False
        results["complete_task"] = False
        results["delete_task"] = False

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for check, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {check}: {status}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! MCP server is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
