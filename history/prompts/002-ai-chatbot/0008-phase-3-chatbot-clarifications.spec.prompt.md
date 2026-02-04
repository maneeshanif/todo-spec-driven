---
id: 0008
title: Phase 3 chatbot clarifications
stage: spec
date: 2026-01-03
surface: agent
model: claude-opus-4-5-20251101
feature: 002-ai-chatbot
branch: 002-phase-5-cloud-deploy
user: user
command: manual
labels: [clarification,phase3]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - none
tests:
  - none
---

## Prompt

ok right now i am in phase 3 of another person prj so please could u ans all of this /sp.clarify ques here is her agent ```/sp.clarify is running…

● 🌱 @bonsai: routing to holy-kite (stealth, free premium model). Enter @switch in your prompt to switch to another frontier model in stealth for free.

● Bash(.specify/scripts/bash/check-prerequisites.sh --json --paths-only)
  ⎿  {
       "REPO_ROOT": "/home/maneeshanif/Desktop/code /python-prjs/dapr/n-hackthon-2/spec-driven-ToDo-App-II",
       "BRANCH": "001-ai-chatbot",
     … +9 lines (ctrl+o to expand)

● Read(specs/001-ai-chatbot/spec.md)
  ⎿  Read 92 lines

● I've analyzed the feature specification for the AI-Powered Todo Chatbot (Phase 3). While the specification is well-structured, I've identified several key areas where implementation details remain ambiguous. These include specific integration points with the backend, the choice of LLM provider, UI layout preferences, and how conversation context windowing should be handled.

  Starting the interactive clarification loop (Max 5 questions).

  Question 1 of 5: LLM Provider

  The spec mentions an "AI Assistant" and "latency/downtime" handling but doesn't specify which LLM provider or model to use. This significantly impacts the backend architecture and required API keys.

  Recommended: OpenAI (gpt-4o-mini) - Offers the best balance of low latency, high reasoning capability for tool use, and cost-efficiency for a todo application.

  | Option | Description                                  |
  |--------|----------------------------------------------|
  | A      | OpenAI (gpt-4o / gpt-4o-mini)                |
  | B      | Anthropic (claude-3-5-sonnet / haiku)        |
  | C      | Local/Ollama (e.g., llama3)                  |
  | Short  | Provide a different short answer (<=5 words) |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.

  ---
  Question 2 of 5: Chat UI Integration

  Should the chatbot exist as a new standalone page or as a retractable sidebar/widget accessible from the main dashboard?

  Recommended: Standalone Page - Provides more space for chat history and complex interactions without cluttering the existing task list UI.

  | Option | Description                      |
  |--------|----------------------------------|
  | A      | Standalone full-page chat        |
  | B      | Retractable sidebar on Dashboard |
  | C      | Floating chat bubble/widget      |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.

  ---
  Question 3 of 5: Message History Window

  To maintain performance and keep LLM costs predictable, how should we handle very long conversation histories?

  Recommended: Sliding Window (Last 20) - Keeps recent context for follow-up commands while preventing context tokens from growing indefinitely.

  | Option | Description                                       |
  |--------|---------------------------------------------------|
  | A      | Sliding Window (last 10-20 messages)              |
  | B      | Summary-based (AI summarizes old history)         |
  | C      | Full History (unlimited tokens - not recommended) |
  | Short  | Provide a different short answer (<=5 words)      |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.

  ---
  Question 4 of 5: Implementation Library (Backend)

  For the chatbot logic and tool-calling, should we use a standard framework or a custom implementation?

  Recommended: LangChain (Python) - Provides mature abstractions for conversation memory, tool-calling (connecting AI to your Task DB), and streaming responses.

  | Option | Description                           |
  |--------|---------------------------------------|
  | A      | LangChain / LangGraph                 |
  | B      | FastMCP (Direct Tool Definition)      |
  | C      | Custom/Vanilla FastAPI implementation |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.

  ---
  Question 5 of 5: "Delete All" Safety

  Should the AI allow bulk destructive commands (e.g., "Delete all my tasks") without a secondary UI confirmation step?

  Recommended: UI Confirmation Required - Destructive bulk actions should trigger a "Are you sure?" prompt in the chat/UI before execution.

  | Option | Description                              |
  |--------|------------------------------------------|
  | A      | UI Confirmation Required                 |
  | B      | AI confirmation only (just saying "Yes") |
  | C      | Block "Delete All" via AI entirely       |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or "recommended", or provide your own short answer.

  Todos
  ☒ Check prerequisites and load feature spec
  ☐ Scan spec for ambiguities and prioritize questions
  ☐ Run interactive clarification loop
  ☐ Update feature spec with clarifications
  ☐ Create PHR and report results
```

## Response snapshot

Provided definitive answers aligned with the openai-agents-setup guidance: chose Gemini via AsyncOpenAI (per skill), standalone chat page, sliding window history, FastMCP with native MCP integration, and UI confirmation for destructive actions.

## Outcome

- ✅ Impact: Clarifications recorded for Phase 3 chatbot
- 🧪 Tests: Not applicable
- 📁 Files: None
- 🔁 Next prompts: None
- 🧠 Reflection: Decisions align with Gemini + MCP architecture

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): None
- Prompt variant (if applicable): None
- Next experiment (smallest change to try): None
