# FastMCP Reference

Detailed API reference for FastMCP Python SDK.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## FastMCP Class

The main class for creating MCP servers.

```python
from fastmcp import FastMCP

mcp = FastMCP(
    name: str,                    # Server name (required)
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | str | Server name displayed to clients |

---

## Tool Decorator

### @mcp.tool (Basic)

Register a function as an MCP tool. No parentheses needed for basic usage.

```python
@mcp.tool
def my_tool(param1: str, param2: int = 0) -> str:
    """Tool description (shown to AI).

    Args:
        param1: Description of param1
        param2: Description of param2
    """
    return "result"
```

### @mcp.tool() (With Configuration)

```python
@mcp.tool(
    name: str | None = None,      # Custom tool name
    description: str | None = None,  # Override docstring
    tags: set[str] | None = None, # Tool categorization
    enabled: bool = True,         # Enable/disable tool
    meta: dict | None = None,     # Custom metadata
)
```

**Configuration Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | str | Custom tool name (default: function name) |
| `description` | str | Tool description (default: docstring) |
| `tags` | set[str] | Tool categories for filtering |
| `enabled` | bool | Enable/disable tool |
| `meta` | dict | Custom metadata passed to client |

**Examples:**

```python
# Custom name
@mcp.tool(name="search_products")
def search(query: str) -> list:
    """Search products by query."""
    return []

# With tags and metadata
@mcp.tool(
    name="create_invoice",
    description="Create a new invoice",
    tags={"billing", "documents"},
    meta={"version": "2.0"}
)
def make_invoice(customer_id: str, amount: float) -> dict:
    return {"invoice_id": "INV-123"}

# Disabled tool (feature flag)
@mcp.tool(enabled=False)
def maintenance_mode():
    """This tool is disabled."""
    return "Not available"
```

**Rules:**
- Docstring becomes tool description (unless overridden)
- Args section documents parameters
- Type hints define parameter types
- Return value is sent back to caller

---

## Resource Decorator

Register a dynamic resource.

```python
@mcp.resource("data://{name}")
def get_data(name: str) -> str:
    """Get data by name."""
    return f"Data for {name}"
```

**Resource URI Patterns:**

| Pattern | Example | Description |
|---------|---------|-------------|
| `data://{id}` | `data://123` | Data by ID |
| `file://{path}` | `file://docs/readme.md` | File resources |
| `config://{key}` | `config://database` | Configuration |

---

## Prompt Decorator

Register a prompt template.

```python
@mcp.prompt()
def greeting_prompt(name: str, style: str = "friendly") -> str:
    """Generate a greeting prompt."""
    return f"Write a {style} greeting for {name}"
```

---

## Tool Input/Output Types

### Input Types

| Python Type | JSON Schema Type |
|-------------|------------------|
| `str` | `string` |
| `int` | `integer` |
| `float` | `number` |
| `bool` | `boolean` |
| `list` | `array` |
| `dict` | `object` |
| `None` | `null` |
| `str \| None` | `string` or `null` |

### Return Types

```python
# String response
@mcp.tool
def string_tool() -> str:
    return "text response"

# Dict response (structured)
@mcp.tool
def dict_tool() -> dict:
    return {"key": "value", "count": 42}

# List response
@mcp.tool
def list_tool() -> list[dict]:
    return [{"id": 1}, {"id": 2}]
```

---

## Server Run Methods

### mcp.run()

Run the server synchronously (blocking).

```python
mcp.run(
    transport: str | None = None,  # "stdio", "http", or "sse"
    host: str = "127.0.0.1",       # Host for HTTP/SSE
    port: int = 8000,              # Port for HTTP/SSE
    path: str = "/mcp",            # Path for HTTP transport
    show_banner: bool = True,      # Show startup banner
)
```

### Transport Examples

```python
# STDIO (default) - for CLI integration
mcp.run()
mcp.run(transport="stdio")

# HTTP - for web deployment (RECOMMENDED)
mcp.run(
    transport="http",
    host="0.0.0.0",
    port=8000,
    path="/mcp"
)

# SSE - legacy HTTP Server-Sent Events
mcp.run(
    transport="sse",
    host="127.0.0.1",
    port=8000
)
```

### Transport Comparison

| Transport | URL Pattern | Use Case |
|-----------|-------------|----------|
| `stdio` | N/A (spawned process) | CLI, desktop apps |
| `http` | `http://host:port/path` | Web apps, APIs |
| `sse` | `http://host:port/sse` | Legacy clients |

---

## FastMCP Client

Connect to MCP servers from Python.

### Basic Usage

```python
import asyncio
from fastmcp import Client

async def main():
    # Connect to HTTP server
    async with Client("http://localhost:8000/mcp") as client:
        # List tools
        tools = await client.list_tools()

        # Call a tool
        result = await client.call_tool("add_task", {
            "user_id": "123",
            "title": "Test task"
        })
        print(result)

asyncio.run(main())
```

### Client Methods

```python
# Check connection
client.is_connected() -> bool

# List available tools
await client.list_tools() -> list[Tool]

# List resources
await client.list_resources() -> list[Resource]

# List prompts
await client.list_prompts() -> list[Prompt]

# Call a tool
await client.call_tool(name: str, arguments: dict) -> CallToolResult

# Read a resource
await client.read_resource(uri: str) -> list[ResourceContents]

# Ping server
await client.ping()
```

### Multiple Server Configuration

```python
from fastmcp import Client

config = {
    "mcpServers": {
        "weather": {"url": "http://localhost:8001/mcp"},
        "tasks": {"url": "http://localhost:8002/mcp"}
    }
}

async with Client(config) as client:
    # Tools are prefixed with server name
    await client.call_tool("weather_get_forecast", {"city": "London"})
    await client.call_tool("tasks_add_task", {"title": "Test"})
```

---

## Async Tools

```python
import httpx

@mcp.tool
async def fetch_url(url: str) -> dict:
    """Fetch data from a URL."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return {
            "status": response.status_code,
            "content_length": len(response.content)
        }
```

---

## Error Handling

```python
@mcp.tool
def safe_tool(param: str) -> dict:
    """Tool with error handling."""
    try:
        result = perform_operation(param)
        return {"status": "success", "data": result}
    except ValueError as e:
        return {"status": "error", "message": str(e)}
    except Exception as e:
        return {"status": "error", "message": "Internal error occurred"}
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# MCP Server Configuration
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8001
MCP_SERVER_PATH=/mcp
```

---

## Best Practices

1. **Use descriptive docstrings** - They become tool descriptions
2. **Type all parameters** - Ensures proper schema generation
3. **Handle errors gracefully** - Return error dicts, don't raise exceptions
4. **Use structured responses** - Return dict/list for complex data
5. **Keep tools focused** - One tool = one operation
6. **Document Args** - Use Args section in docstrings
7. **Use HTTP transport** - For agent integration in Phase 3
8. **Test with Client** - Use FastMCP Client to verify tools work

---

## See Also

- [SKILL.md](./SKILL.md) - Quick start guide
- [TOOLS.md](./TOOLS.md) - Tool definition patterns
- [examples.md](./examples.md) - Complete code examples
- [FastMCP GitHub](https://github.com/jlowin/fastmcp)
