#!/usr/bin/env python3
"""
Test script for conversation management endpoints.
Run this to verify conversation CRUD operations are working correctly.

Usage:
    # First start the backend server:
    cd backend && uv run uvicorn src.main:app --reload

    # Then run this test:
    python .claude/skills/conversation-management/scripts/test-conversations.py

Environment variables:
    API_URL: Backend URL (default: http://localhost:8000)
    TEST_TOKEN: JWT auth token (required for authenticated endpoints)
"""

import os
import sys
import asyncio
import httpx


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
    ]

    all_passed = True

    for module, package_name in packages:
        try:
            __import__(module)
            print_status(f"{package_name}", True)
        except ImportError:
            print_status(f"{package_name}", False, f"Install with: pip install {package_name}")
            all_passed = False

    return all_passed


class ConversationTester:
    """Test conversation management endpoints."""

    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }
        self.created_conversation_id = None

    async def test_list_conversations(self) -> bool:
        """Test GET /api/conversations"""
        print("\n📋 Testing List Conversations...")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/conversations",
                    headers=self.headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    print_status(
                        "List conversations",
                        True,
                        f"Found {len(data)} conversation(s)"
                    )
                    return True
                elif response.status_code == 401:
                    print_status("List conversations", False, "Unauthorized - check token")
                    return False
                else:
                    print_status(
                        "List conversations",
                        False,
                        f"HTTP {response.status_code}: {response.text[:100]}"
                    )
                    return False

        except httpx.ConnectError:
            print_status("Connection", False, "Cannot connect to server")
            return False
        except Exception as e:
            print_status("List conversations", False, str(e)[:100])
            return False

    async def test_create_conversation(self) -> bool:
        """Test POST /api/conversations"""
        print("\n➕ Testing Create Conversation...")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/conversations",
                    headers=self.headers,
                    json={"title": "Test Conversation from Script"},
                )

                if response.status_code in [200, 201]:
                    data = response.json()
                    self.created_conversation_id = data.get("id")
                    print_status(
                        "Create conversation",
                        True,
                        f"Created ID: {self.created_conversation_id}"
                    )
                    return True
                else:
                    print_status(
                        "Create conversation",
                        False,
                        f"HTTP {response.status_code}: {response.text[:100]}"
                    )
                    return False

        except Exception as e:
            print_status("Create conversation", False, str(e)[:100])
            return False

    async def test_get_conversation(self) -> bool:
        """Test GET /api/conversations/{id}"""
        print("\n🔍 Testing Get Conversation...")

        if not self.created_conversation_id:
            print_status("Get conversation", False, "No conversation ID (create failed)")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/conversations/{self.created_conversation_id}",
                    headers=self.headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    print_status(
                        "Get conversation",
                        True,
                        f"Title: {data.get('title')}, Messages: {data.get('message_count', 0)}"
                    )
                    return True
                elif response.status_code == 404:
                    print_status("Get conversation", False, "Not found")
                    return False
                else:
                    print_status(
                        "Get conversation",
                        False,
                        f"HTTP {response.status_code}"
                    )
                    return False

        except Exception as e:
            print_status("Get conversation", False, str(e)[:100])
            return False

    async def test_update_conversation(self) -> bool:
        """Test PATCH /api/conversations/{id}"""
        print("\n✏️  Testing Update Conversation...")

        if not self.created_conversation_id:
            print_status("Update conversation", False, "No conversation ID")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.base_url}/api/conversations/{self.created_conversation_id}",
                    headers=self.headers,
                    json={"title": "Updated Test Conversation"},
                )

                if response.status_code == 200:
                    data = response.json()
                    print_status(
                        "Update conversation",
                        True,
                        f"New title: {data.get('title')}"
                    )
                    return True
                else:
                    print_status(
                        "Update conversation",
                        False,
                        f"HTTP {response.status_code}"
                    )
                    return False

        except Exception as e:
            print_status("Update conversation", False, str(e)[:100])
            return False

    async def test_delete_conversation(self) -> bool:
        """Test DELETE /api/conversations/{id}"""
        print("\n🗑️  Testing Delete Conversation...")

        if not self.created_conversation_id:
            print_status("Delete conversation", False, "No conversation ID")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/api/conversations/{self.created_conversation_id}",
                    headers=self.headers,
                )

                if response.status_code in [200, 204]:
                    print_status("Delete conversation", True, "Cleaned up test data")
                    return True
                else:
                    print_status(
                        "Delete conversation",
                        False,
                        f"HTTP {response.status_code}"
                    )
                    return False

        except Exception as e:
            print_status("Delete conversation", False, str(e)[:100])
            return False


async def test_backend_endpoints_exist() -> dict:
    """Check if backend has the conversation endpoints."""
    print("\n🔌 Checking Backend Endpoints...")

    base_url = os.getenv("API_URL", "http://localhost:8000")

    try:
        async with httpx.AsyncClient() as client:
            # Try to get OpenAPI docs
            response = await client.get(f"{base_url}/openapi.json")

            if response.status_code == 200:
                openapi = response.json()
                paths = openapi.get("paths", {})

                endpoints = {
                    "list": "/api/conversations" in paths,
                    "create": "/api/conversations" in paths,
                    "get": any("/api/conversations/{" in p for p in paths),
                    "update": any("/api/conversations/{" in p for p in paths),
                    "delete": any("/api/conversations/{" in p for p in paths),
                }

                for name, exists in endpoints.items():
                    print_status(f"Endpoint: {name}", exists)

                return endpoints

            else:
                print_status("OpenAPI check", False, f"HTTP {response.status_code}")
                return {}

    except httpx.ConnectError:
        print_status("Connection", False, f"Cannot connect to {base_url}")
        return {}
    except Exception as e:
        print_status("Endpoint check", False, str(e)[:100])
        return {}


async def main():
    """Run all conversation tests."""
    print("=" * 60)
    print("🔍 Conversation Management Test Suite")
    print("=" * 60)

    results = {}

    # Package check
    results["packages"] = check_packages()

    if not results["packages"]:
        print("\n⚠️  Missing packages. Install them and try again.")
        return 1

    # Configuration
    base_url = os.getenv("API_URL", "http://localhost:8000")
    token = os.getenv("TEST_TOKEN")

    print(f"\n🔧 Configuration:")
    print(f"   API_URL: {base_url}")
    print(f"   TEST_TOKEN: {'Set' if token else 'Not set'}")

    # Check endpoints exist
    endpoints = await test_backend_endpoints_exist()

    if not endpoints:
        print("\n⚠️  Could not verify endpoints. Is the server running?")
        print(f"   Start with: cd backend && uv run uvicorn src.main:app --reload")

    if not token:
        print("\n⚠️  No TEST_TOKEN provided. Skipping CRUD tests.")
        print("   Set TEST_TOKEN environment variable to test authenticated endpoints.")
        print("\n   Example:")
        print("   export TEST_TOKEN='your-jwt-token-here'")
        results["crud_tests"] = None
    else:
        # Run CRUD tests
        tester = ConversationTester(base_url, token)

        results["list"] = await tester.test_list_conversations()

        if results["list"]:
            results["create"] = await tester.test_create_conversation()

            if results["create"]:
                results["get"] = await tester.test_get_conversation()
                results["update"] = await tester.test_update_conversation()
                results["delete"] = await tester.test_delete_conversation()

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

    if passed == total and total > 0:
        print("\n🎉 All tests passed! Conversation management is working.")
        return 0
    else:
        print("\n⚠️  Some tests failed or were skipped.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
