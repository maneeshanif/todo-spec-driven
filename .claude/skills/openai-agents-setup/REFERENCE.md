# OpenAI Agents SDK Reference with Gemini

Detailed API reference for the OpenAI Agents SDK with **Gemini model integration**.

**Reference Repository**: https://github.com/panaversity/learn-agentic-ai

---

## Third-Party Model Integration

### OpenAIChatCompletionsModel

The key class for using external LLMs like Gemini with the OpenAI Agents SDK:

```python
from agents import OpenAIChatCompletionsModel
from openai import AsyncOpenAI

# Create client pointing to Gemini's OpenAI-compatible API
client = AsyncOpenAI(
    api_key="your-gemini-api-key",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
)

# Wrap with OpenAIChatCompletionsModel
model = OpenAIChatCompletionsModel(
    model="gemini-2.5-flash",
    openai_client=client,
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `model` | str | Model identifier (e.g., `gemini-2.5-flash`) |
| `openai_client` | AsyncOpenAI | Configured async client |

### Supported Gemini Models

| Model | Best For | Speed |
|-------|----------|-------|
| `gemini-2.5-flash` | General tasks, fast responses | Fast |
| `gemini-2.0-flash-exp` | Experimental features | Fast |
| `gemini-1.5-pro` | Complex reasoning | Medium |
| `gemini-1.5-flash` | Balance of speed/quality | Fast |

---

## Core Classes

### Agent

The main class for creating AI agents.

```python
from agents import Agent

agent = Agent(
    name: str,                    # Required: Agent name
    instructions: str,            # Required: System prompt
    model: OpenAIChatCompletionsModel,  # Gemini model wrapper
    tools: list = [],             # List of function tools
    handoffs: list = [],          # Agents to hand off to
    hooks: AgentHooks = None,     # Lifecycle hooks
    tool_use_behavior: str = "run_llm_again",
)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | str | Unique identifier for the agent |
| `instructions` | str | System prompt defining agent behavior |
| `model` | OpenAIChatCompletionsModel | Model wrapper for Gemini |
| `tools` | list | Function tools the agent can use |
| `handoffs` | list | Other agents this agent can delegate to |
| `hooks` | AgentHooks | Optional lifecycle hooks |
| `tool_use_behavior` | str | How to handle tool results |

**Tool Use Behaviors:**

- `"run_llm_again"` - Default. After tool executes, LLM processes the result
- `"stop_on_first_tool"` - Stop after first tool call, return tool output as final

---

### Runner

Executes agents and manages conversation flow.

```python
from agents import Runner

result = await Runner.run(
    agent: Agent,                 # Agent to run
    input: str | list,            # User input or conversation
    hooks: RunHooks = None,       # Runner lifecycle hooks
    max_turns: int = 10,          # Maximum conversation turns
)
```

**Return Value (RunResult):**

```python
result.final_output      # str: The agent's final response
result.last_agent        # Agent: The agent that produced the output
result.new_items         # list: New conversation items generated
result.input_tokens      # int: Tokens used for input (if available)
result.output_tokens     # int: Tokens used for output (if available)
```

### Runner.run_streamed

For streaming responses:

```python
from agents import Runner

result = Runner.run_streamed(
    agent: Agent,
    input: str | list,
    hooks: RunHooks = None,
)

async for event in result.stream_events():
    if event.type == "raw_response_event":
        print(event.data)  # Partial response
```

---

### function_tool Decorator

Converts Python functions into agent tools.

```python
from agents import function_tool
from typing import Annotated

@function_tool
async def my_tool(
    param1: Annotated[str, "Description of param1"],
    param2: Annotated[int, "Description of param2"] = 0
) -> str:
    """Tool description shown to the agent."""
    return "result"
```

**Rules:**
- Function **must** have a docstring (becomes tool description)
- Use `Annotated` for parameter descriptions
- Return type should be str, dict, or list
- Can be sync or async
- First argument description is critical for LLM understanding

---

### FunctionTool Class

For more control over tool definition:

```python
from agents import FunctionTool

tool = FunctionTool(
    name="custom_tool",
    description="What this tool does",
    params_json_schema={
        "type": "object",
        "properties": {
            "param1": {"type": "string", "description": "..."}
        },
        "required": ["param1"]
    },
    on_invoke_tool=my_async_function,
)
```

---

## Lifecycle Hooks

### AgentHooks

Hooks attached to individual agents:

```python
from agents import AgentHooks, RunContextWrapper, Agent, Tool

class MyAgentHooks(AgentHooks):

    async def on_start(self, context: RunContextWrapper, agent: Agent) -> None:
        """Called when agent starts processing."""
        pass

    async def on_end(self, context: RunContextWrapper, agent: Agent, output: str) -> None:
        """Called when agent finishes."""
        pass

    async def on_tool_start(self, context: RunContextWrapper, agent: Agent, tool: Tool) -> None:
        """Called before a tool executes."""
        pass

    async def on_tool_end(self, context: RunContextWrapper, agent: Agent, tool: Tool, result: str) -> None:
        """Called after a tool executes."""
        pass

    async def on_handoff(self, context: RunContextWrapper, agent: Agent, target: Agent) -> None:
        """Called when agent hands off to another agent."""
        pass
```

**Usage:**
```python
agent = Agent(
    name="MyAgent",
    instructions="...",
    model=get_gemini_model(),
    hooks=MyAgentHooks(),  # Attach hooks
)
```

### RunHooks

Hooks for the entire Runner execution:

```python
from agents import RunHooks, RunContextWrapper, Agent

class MyRunHooks(RunHooks):

    async def on_run_start(self, context: RunContextWrapper) -> None:
        """Called when the entire run begins."""
        pass

    async def on_run_end(self, context: RunContextWrapper, output: str) -> None:
        """Called when the entire run completes."""
        pass

    async def on_agent_start(self, context: RunContextWrapper, agent: Agent) -> None:
        """Called when any agent in the run starts."""
        pass

    async def on_agent_end(self, context: RunContextWrapper, agent: Agent, output: str) -> None:
        """Called when any agent in the run ends."""
        pass
```

**Usage:**
```python
result = await Runner.run(
    agent,
    input="Hello",
    hooks=MyRunHooks(),  # Attach run hooks
)
```

---

## Conversation Items

### Input Types

```python
from agents.items import TResponseInputItem

# Simple string input
input = "Hello, how are you?"

# Conversation history
input: list[TResponseInputItem] = [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hello!"},
    {"role": "user", "content": "What's my task list?"},
]
```

### Message Roles

| Role | Description |
|------|-------------|
| `user` | User messages |
| `assistant` | Agent responses |
| `system` | System messages (usually instructions) |
| `tool` | Tool call results |

---

## Advanced Patterns

### Context Injection via Closure

Pass context (user_id, db_session) to tools via closures:

```python
def create_tools_with_context(user_id: str, db_session):
    """Create tools with user context baked in."""

    @function_tool
    async def add_task(
        title: Annotated[str, "Task title"],
        description: Annotated[str, "Description"] = ""
    ) -> str:
        """Add a task for the current user."""
        # user_id and db_session available via closure!
        task = await create_task(db_session, user_id, title, description)
        return f"Created: {task.title}"

    @function_tool
    async def list_tasks() -> str:
        """List current user's tasks."""
        tasks = await get_tasks(db_session, user_id)
        return format_tasks(tasks)

    return [add_task, list_tasks]

# Usage
tools = create_tools_with_context(user_id="123", db_session=session)
agent = Agent(
    name="TodoAgent",
    model=get_gemini_model(),
    tools=tools,
)
```

### RunContextWrapper

Pass typed context through the run:

```python
from agents import RunContextWrapper
from pydantic import BaseModel

class MyContext(BaseModel):
    user_id: str
    db_session: Any

@function_tool
async def get_tasks(ctx: RunContextWrapper[MyContext]) -> list:
    """Get tasks using context."""
    user_id = ctx.context.user_id
    # Access ctx.context.db_session
    return []

# Run with context
context = MyContext(user_id="123", db_session=session)
result = await Runner.run(agent, input="Show tasks", context=context)
```

### Agent as Tool

Use one agent as a tool for another:

```python
specialist_agent = Agent(
    name="Task Specialist",
    instructions="You handle complex task operations",
    model=get_gemini_model(),
)

main_agent = Agent(
    name="Main Assistant",
    model=get_gemini_model(),
    tools=[
        specialist_agent.as_tool(
            tool_name="task_specialist",
            tool_description="Handles complex task operations"
        )
    ]
)
```

### Handoffs Between Agents

```python
spanish_agent = Agent(
    name="Spanish Agent",
    instructions="Respond only in Spanish",
    model=get_gemini_model(),
)

main_agent = Agent(
    name="Main Agent",
    instructions="If user speaks Spanish, handoff to Spanish Agent",
    model=get_gemini_model(),
    handoffs=[spanish_agent]
)
```

---

## Error Handling

```python
from agents.exceptions import (
    AgentError,
    ToolError,
    MaxTurnsExceeded,
)

try:
    result = await Runner.run(agent, input="...")
except MaxTurnsExceeded:
    print("Conversation exceeded max turns")
except ToolError as e:
    print(f"Tool failed: {e}")
except AgentError as e:
    print(f"Agent error: {e}")
```

---

## Environment Variables

```env
# Required for Gemini
GEMINI_API_KEY=your_gemini_api_key

# Optional
GEMINI_MODEL=gemini-2.5-flash  # Default model

# For OpenAI (alternative)
OPENAI_API_KEY=sk-...
OPENAI_ORG_ID=org-...
```

---

## File Structure

```
backend/src/agents/
├── __init__.py           # Public exports
├── gemini_config.py      # AsyncOpenAI + OpenAIChatCompletionsModel
├── tools.py              # @function_tool definitions
├── hooks.py              # AgentHooks + RunHooks
├── todo_agent.py         # Agent definition
└── runner.py             # Runner execution helpers
```

---

## Best Practices

1. **Separate concerns**: Keep tools, hooks, config, and agent in separate files
2. **Use async tools**: All tools should be async for non-blocking execution
3. **Descriptive docstrings**: Tool docstrings are critical - LLM uses them
4. **Use Annotated types**: Parameter descriptions help LLM understand usage
5. **Handle errors in tools**: Return error messages, don't raise exceptions
6. **Log hook events**: Use hooks for observability and debugging
7. **Limit max_turns**: Prevent runaway conversations
8. **Inject context via closures**: Keep tools stateless but context-aware

---

## Quick Reference

| Component | Import | Purpose |
|-----------|--------|---------|
| `OpenAIChatCompletionsModel` | `from agents import OpenAIChatCompletionsModel` | Wrap Gemini for SDK |
| `AsyncOpenAI` | `from openai import AsyncOpenAI` | HTTP client for API |
| `Agent` | `from agents import Agent` | Define agent |
| `function_tool` | `from agents import function_tool` | Create tools |
| `Runner` | `from agents import Runner` | Execute agent |
| `AgentHooks` | `from agents import AgentHooks` | Agent lifecycle |
| `RunHooks` | `from agents import RunHooks` | Runner lifecycle |
