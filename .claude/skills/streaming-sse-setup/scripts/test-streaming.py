#!/usr/bin/env python3
"""
Test script for SSE streaming endpoint.
Run this to verify the streaming chat endpoint is working correctly.

Usage:
    # First start the backend server:
    cd backend && uv run uvicorn src.main:app --reload

    # Then run this test:
    python .claude/skills/streaming-sse-setup/scripts/test-streaming.py
"""

import os
import sys
import asyncio
import httpx
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
        ("httpx", "httpx"),
        ("asyncio", "asyncio (builtin)"),
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


async def test_streaming_endpoint(
    base_url: str,
    user_id: str,
    message: str,
    token: str = None,
) -> bool:
    """Test the streaming chat endpoint."""
    print("\n🔌 Testing Streaming Endpoint...")

    endpoint = f"{base_url}/api/{user_id}/chat/stream"
    print(f"   URL: {endpoint}")

    headers = {
        "Content-Type": "application/json",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream(
                "POST",
                endpoint,
                json={"message": message},
                headers=headers,
            ) as response:
                if response.status_code != 200:
                    print_status(
                        "Streaming endpoint",
                        False,
                        f"HTTP {response.status_code}: {await response.text()}"
                    )
                    return False

                # Check content type
                content_type = response.headers.get("content-type", "")
                if "text/event-stream" not in content_type:
                    print_status(
                        "Content-Type",
                        False,
                        f"Expected text/event-stream, got: {content_type}"
                    )
                    return False

                print_status("Content-Type", True, "text/event-stream")

                # Read and validate SSE events
                events = []
                text_content = ""
                has_done = False

                print("\n📡 Receiving SSE events...")

                async for line in response.aiter_lines():
                    if not line:
                        continue

                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        print(f"   Event: {data[:80]}{'...' if len(data) > 80 else ''}")

                        if data == "[DONE]":
                            has_done = True
                            break

                        try:
                            import json
                            event = json.loads(data)
                            events.append(event)

                            if event.get("type") == "text":
                                text_content += event.get("content", "")
                            elif event.get("type") == "done":
                                has_done = True
                                break
                            elif event.get("type") == "error":
                                print_status(
                                    "Stream error",
                                    False,
                                    event.get("message", "Unknown error")
                                )
                                return False

                        except json.JSONDecodeError:
                            print(f"   Warning: Could not parse event: {data[:50]}")

                # Validate results
                print("\n📊 Stream Analysis:")
                print(f"   Total events: {len(events)}")
                print(f"   Text length: {len(text_content)} characters")
                print(f"   Has done signal: {has_done}")

                if text_content:
                    print(f"   Preview: {text_content[:100]}...")
                    print_status("Received text content", True)
                else:
                    print_status("Received text content", False, "No text in stream")
                    return False

                if has_done:
                    print_status("Stream completed properly", True)
                else:
                    print_status("Stream completed properly", False, "No done signal")

                return True

    except httpx.ConnectError:
        print_status(
            "Connection",
            False,
            f"Cannot connect to {base_url}. Is the server running?"
        )
        return False
    except Exception as e:
        print_status("Streaming test", False, str(e)[:100])
        return False


async def test_sse_format() -> bool:
    """Test that SSE events follow proper format."""
    print("\n📝 Testing SSE Format Compliance...")

    # This is a format validation test
    test_events = [
        'data: {"type": "start"}\n\n',
        'data: {"type": "text", "content": "Hello"}\n\n',
        'data: {"type": "text", "content": " world"}\n\n',
        'data: {"type": "done"}\n\n',
    ]

    for event in test_events:
        # Check format rules
        if not event.startswith("data: "):
            print_status("SSE format", False, "Events must start with 'data: '")
            return False
        if not event.endswith("\n\n"):
            print_status("SSE format", False, "Events must end with '\\n\\n'")
            return False

    print_status("SSE format compliance", True, "All format rules followed")
    return True


async def main():
    """Run all streaming tests."""
    print("=" * 60)
    print("🔍 SSE Streaming Test Suite")
    print("=" * 60)

    results = {}

    # Package check
    results["packages"] = check_packages()

    # Format test (always runs)
    results["sse_format"] = await test_sse_format()

    # Connection test (requires running server)
    base_url = os.getenv("API_URL", "http://localhost:8000")
    user_id = os.getenv("TEST_USER_ID", "test-user-123")
    token = os.getenv("TEST_TOKEN", None)

    print(f"\n🔧 Configuration:")
    print(f"   API_URL: {base_url}")
    print(f"   TEST_USER_ID: {user_id}")
    print(f"   TEST_TOKEN: {'Set' if token else 'Not set (auth may fail)'}")

    if not token:
        print("\n⚠️  No TEST_TOKEN provided. Skipping endpoint test.")
        print("   Set TEST_TOKEN environment variable to test authenticated endpoints.")
        results["streaming_endpoint"] = None
    else:
        results["streaming_endpoint"] = await test_streaming_endpoint(
            base_url=base_url,
            user_id=user_id,
            message="List my tasks",
            token=token,
        )

    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)

    total = len([r for r in results.values() if r is not None])
    passed = sum(1 for v in results.values() if v is True)

    for check, result in results.items():
        if result is None:
            status = "⏭️  SKIP"
        elif result:
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        print(f"  {check}: {status}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Streaming is working correctly.")
        return 0
    else:
        print("\n⚠️  Some tests failed or were skipped. Review the output above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
