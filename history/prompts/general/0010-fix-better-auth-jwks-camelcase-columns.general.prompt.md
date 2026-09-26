---
id: 0010
title: Fix Better Auth jwks camelCase columns
stage: general
date: 2026-08-24
surface: agent
model: Gemini 3.5 Flash
feature: none
branch: main
user: unknown
command: run_command
labels: [database,better-auth,bug-fix]
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

stilll ``` ``` 

## Response snapshot

Diagnosed a 500 Internal Server Error during the authenticated session query `/api/auth/get-session` caused by missing camelCase columns `"publicKey"`, `"privateKey"`, and `"createdAt"` in the manually created `jwks` table. Dropped the existing table and recreated it with double-quoted camelCase columns, successfully verifying that the session query now returns `200 OK`.

## Outcome

- ✅ Impact: Resolved the authentication session retrieval 500 error; the frontend session endpoint now responds with `200 OK`.
- 🧪 Tests: Confirmed `GET /api/auth/get-session` returns `200 OK` in the Next.js logs.
- 📁 Files: None (database schema update only).
- 🔁 Next prompts: Instruct the user to try refreshing and logging in again.
- 🧠 Reflection: PostgreSQL folds unquoted identifiers to lowercase by default, so camelCase columns in third-party integrations like Better Auth must be wrapped in double quotes during manual creation.

## Evaluation notes (flywheel)

- Failure modes observed: Case sensitivity of database column names (`publicKey`, `privateKey`, `createdAt`) in the Better Auth Kysely adapter causing database query failures.
- Graders run and results (PASS/FAIL): PASS (manual server log check)
- Next experiment (smallest change to try): Add a troubleshooting/known-issues section to the documentation outlining the double-quoted camelCase requirements for manually run database tables.
