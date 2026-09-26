---
id: 0012
title: Move servers to non-conflicting ports
stage: general
date: 2026-08-25
surface: agent
model: Gemini 3.5 Flash
feature: none
branch: main
user: unknown
command: run_command
labels: [setup,local-run,port-conflict,bug-fix]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - /backend/.env
 - /frontend/.env.local
tests:
 - none
---

## Prompt

still backend server is crashing `` ``

## Response snapshot

Diagnosed that the user is running another Docker-based project (Bazaarflow) in the background, which auto-starts containers on ports 3000 and 8000, causing port binding conflicts. Reconfigured our application environment files and launched the FastAPI backend on port 8010, the FastMCP server on port 8011, and the Next.js frontend on port 3010, successfully verifying that they run stably side-by-side.

## Outcome

- ✅ Impact: Resolved all port collisions; the application now runs stably on custom ports.
- 🧪 Tests: Confirmed health checks on `http://localhost:3010` and `http://localhost:8010` are working.
- 📁 Files: Updated backend/.env and frontend/.env.local.
- 🔁 Next prompts: Ask the user to visit http://localhost:3010 to log in.
- 🧠 Reflection: Choosing distinct development ports prevents conflicts when users run multiple active projects concurrently.

## Evaluation notes (flywheel)

- Failure modes observed: Port conflicts on default 3000/8000 ports due to background projects.
- Graders run and results (PASS/FAIL): PASS (manual port checks)
- Next experiment (smallest change to try): Update setup documentation with customizable PORT configurations.
