#!/usr/bin/env python3
"""
Validation script for OpenAI Agents SDK setup with Gemini integration.
Run this to verify all components are correctly configured.

Usage:
    cd backend
    uv run python -m scripts.validate-setup
    # OR from project root:
    python .claude/skills/openai-agents-setup/scripts/validate-setup.py
"""

import os
import sys
import asyncio
from pathlib import Path


def print_status(check: str, passed: bool, details: str = ""):
    """Print status with emoji indicator."""
    emoji = "✅" if passed else "❌"
    print(f"{emoji} {check}")
    if details and not passed:
        print(f"   └─ {details}")


def check_environment_variables() -> bool:
    """Check required environment variables."""
    print("\n📋 Checking Environment Variables...")

    required_vars = {
        "GEMINI_API_KEY": "Gemini API key for model access",
    }

    optional_vars = {
        "GEMINI_MODEL": "Model name (default: gemini-2.5-flash)",
        "MCP_SERVER_URL": "MCP server URL (default: http://localhost:8001/mcp)",
    }

    all_passed = True

    for var, description in required_vars.items():
        value = os.getenv(var)
        passed = bool(value)
        if not passed:
            all_passed = False
        print_status(f"{var}", passed, f"Required: {description}")

    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            print_status(f"{var}", True, f"Set to: {value[:20]}...")
        else:
            print(f"⚪ {var} (optional, using default)")

    return all_passed


def check_packages() -> bool:
    """Check required packages are installed."""
    print("\n📦 Checking Required Packages...")

    packages = [
        ("openai", "openai"),
        ("agents", "openai-agents"),
        ("fastmcp", "fastmcp"),
        ("httpx", "httpx"),
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


def check_agents_folder_structure() -> bool:
    """Check the agents folder structure exists."""
    print("\n📁 Checking Agents Folder Structure...")

    backend_path = Path.cwd()
    if backend_path.name != "backend":
        backend_path = Path.cwd() / "backend"

    agents_path = backend_path / "src" / "agents"

    expected_files = [
        "__init__.py",
        "gemini_config.py",
        "mcp_tools.py",
        "hooks.py",
        "todo_agent.py",
        "runner.py",
    ]

    all_passed = True

    if not agents_path.exists():
        print_status("agents/ directory", False, f"Expected at: {agents_path}")
        return False

    print_status("agents/ directory", True)

    for filename in expected_files:
        file_path = agents_path / filename
        exists = file_path.exists()
        if not exists:
            all_passed = False
        print_status(f"  {filename}", exists)

    return all_passed


async def check_gemini_connection() -> bool:
    """Test connection to Gemini API."""
    print("\n🔌 Testing Gemini API Connection...")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print_status("Gemini API", False, "GEMINI_API_KEY not set")
        return False

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

        # Simple test request
        response = await client.chat.completions.create(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            messages=[{"role": "user", "content": "Say 'test' and nothing else."}],
            max_tokens=10,
        )

        if response.choices:
            print_status("Gemini API connection", True, "Successfully connected")
            return True
        else:
            print_status("Gemini API connection", False, "No response received")
            return False

    except Exception as e:
        print_status("Gemini API connection", False, str(e)[:100])
        return False


async def check_mcp_server() -> bool:
    """Test connection to MCP server."""
    print("\n🔌 Testing MCP Server Connection...")

    mcp_url = os.getenv("MCP_SERVER_URL", "http://localhost:8001/mcp")

    try:
        from fastmcp import Client

        async with Client(mcp_url) as client:
            tools = await client.list_tools()
            tool_names = [t.name for t in tools]

            print_status("MCP Server connection", True, f"URL: {mcp_url}")
            print(f"   └─ Available tools: {', '.join(tool_names)}")

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
        print_status("MCP Server connection", False, f"{str(e)[:80]}")
        print(f"   └─ Make sure MCP server is running at {mcp_url}")
        return False


def check_basic_agent() -> bool:
    """Test creating a basic agent with Gemini."""
    print("\n🤖 Testing Basic Agent Creation...")

    try:
        from agents import Agent, function_tool, OpenAIChatCompletionsModel
        from openai import AsyncOpenAI

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print_status("Basic agent", False, "GEMINI_API_KEY not set")
            return False

        # Create Gemini client
        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )

        model = OpenAIChatCompletionsModel(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            openai_client=client,
        )

        @function_tool
        def test_tool(message: str) -> str:
            """Test tool that echoes message."""
            return f"Received: {message}"

        agent = Agent(
            name="TestAgent",
            instructions="You are a test agent.",
            model=model,
            tools=[test_tool],
        )

        print_status("Basic agent creation", True, f"Agent name: {agent.name}")
        return True

    except Exception as e:
        print_status("Basic agent creation", False, str(e)[:100])
        return False


async def main():
    """Run all validation checks."""
    print("=" * 60)
    print("🔍 OpenAI Agents SDK + Gemini Setup Validation")
    print("=" * 60)

    results = {}

    # Synchronous checks
    results["env_vars"] = check_environment_variables()
    results["packages"] = check_packages()
    results["folder_structure"] = check_agents_folder_structure()

    # Dependent checks
    if results["packages"] and results["env_vars"]:
        results["basic_agent"] = check_basic_agent()
        results["gemini"] = await check_gemini_connection()
        results["mcp"] = await check_mcp_server()
    else:
        print("\n⚠️  Skipping connection tests (missing packages or env vars)")
        results["basic_agent"] = False
        results["gemini"] = False
        results["mcp"] = False

    # Summary
    print("\n" + "=" * 60)
    print("📊 Validation Summary")
    print("=" * 60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)

    for check, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {check}: {status}")

    print(f"\n  Total: {passed}/{total} checks passed")

    if passed == total:
        print("\n🎉 All checks passed! Setup is complete.")
        return 0
    else:
        print("\n⚠️  Some checks failed. Review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
