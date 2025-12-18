"""MCP Tools documentation for the TodoBot Agent.

NOTE: With the OpenAI Agents SDK's native MCP integration, we no longer need
@function_tool wrappers! The agent connects directly to the MCP server via
MCPServerStreamableHttp and discovers tools automatically.

The MCP server at backend/src/mcp_server/server.py provides these tools:
- add_task: Create a new task for a user
- list_tasks: List user's tasks with optional status filter
- complete_task: Mark a task as completed
- delete_task: Delete a task permanently
- update_task: Update a task's title or description

OLD APPROACH (not needed anymore):
    @function_tool
    async def add_task(...) -> str:
        async with Client(mcp_url) as client:
            result = await client.call_tool("add_task", {...})
            return str(result)

NEW APPROACH (native MCP integration):
    async with MCPServerStreamableHttp(
        name="Todo MCP Server",
        params={"url": mcp_url},
    ) as mcp_server:
        agent = Agent(
            name="TodoBot",
            mcp_servers=[mcp_server],  # Tools discovered automatically!
        )
        result = await Runner.run(agent, ...)

This file is kept for documentation and backwards compatibility.
See runner.py for the actual implementation.
"""

# Legacy exports for backwards compatibility (now empty)
# The actual tool execution happens via native MCP integration in runner.py

__all__ = []
