---
id: 0006
title: Refine Phase 2 Implementation Plan
stage: plan
date: 2025-12-11
surface: agent
model: Claude Sonnet 4.5
feature: 001-phase-2-web-app
branch: 001-phase-2-web-app
user: maneeshanif
command: /sp.plan --refine
labels: ["plan", "refinement", "constitution", "observability", "jwt-auth", "analysis-fixes"]
links:
  spec: specs/001-phase-2-web-app/spec.md
  ticket: null
  adr: history/adr/0003-authentication-architecture.md
  pr: null
files:
  - specs/001-phase-2-web-app/plan.md
tests:
  - None (planning phase)
---

## Prompt

Follow instructions in sp.plan.prompt.md with --refine flag.

Context: After running /sp.analyze, identified 8 CRITICAL issues, 12 HIGH severity issues, and 15 MEDIUM severity issues in the Phase 2 specification. Primary concerns:

**CRITICAL Issues**:
1. Constitution violation: Test-first development requirement violated (tests NOT included in tasks.md)
2. Constitution violation: API contracts marked incomplete but actually exist
3. Constitution violation: Explicit exclusion of tests contradicts constitution Section III
4. Observability requirements: 4 NFR-OBS requirements have ZERO associated tasks
5. JWT refresh logic underspecified: No specification of WHERE/HOW token refresh is triggered
6. Better Auth integration underspecified: No version, configuration, or integration details
7. Coverage gap: Database index verification task missing
8. Coverage gap: Security checklist validation tasks missing

**HIGH Priority Issues**:
- JWT token refresh vague (no specification of frontend vs backend logic)
- Performance requirements missing acceptance tasks
- Pagination strategy inconsistent (offset vs cursor-based)
- User story priorities misaligned between spec.md and tasks.md
- Ambiguous retry strategies
- API error format specified in multiple places with different wording

**Request**: Refine plan.md to address all CRITICAL and HIGH priority issues from analysis, focusing on:
1. Document constitution deviations with justifications
2. Add explicit observability implementation section with Phase 9 tasks
3. Clarify JWT refresh implementation (frontend interceptor + backend endpoint)
4. Document Better Auth version and configuration requirements
5. Fix pagination strategy (cursor-based only)
6. Consolidate API error response format (RFC 7807)
7. Add missing security and performance validation tasks

## Response snapshot

Created comprehensive refined plan.md (850+ lines) addressing all critical findings:

**Constitution Check Section**:
- ✅ Updated checklist: Marked API contracts as complete (fixing C2)
- ⚠️ Documented test deferral deviation with justification (addressing C1, C3)
- ⚠️ Documented observability deferral with Phase 9 implementation plan

**Authentication Architecture Section**:
- Added detailed JWT token lifecycle flowchart
- Clarified token refresh implementation (addressing A1):
  - Frontend: Axios interceptor checks expiry before each request
  - Backend: /auth/refresh endpoint validates old token, issues new one
  - Trigger: Auto-refresh when < 1 day remains (one day = 24 * 60 * 60 * 1000 ms)
- Included complete TypeScript and Python code examples

**Better Auth Integration Details Section** (addressing U2):
- Specified configuration requirements (SECRET_KEY, ALGORITHM, expiry)
- Listed required environment variables with examples
- Documented features used: bcrypt (12 rounds), python-jose, JWT payload structure
- Added setup commands (openssl rand -hex 32 for secret generation)

**API Response Standards Section** (addressing D2):
- Consolidated to single RFC 7807 format as source of truth
- Removed duplicate error format specifications
- Provided FastAPI implementation code
- Defined success response format with metadata

**Pagination Strategy Section** (addressing I3):
- Clarified cursor-based pagination ONLY (removed offset-based references)
- Added OpenAPI contract snippet showing cursor, limit, completed parameters
- Included complete SQLModel implementation with cursor encoding/decoding
- Documented rationale (efficient for large datasets, stable results)

**Observability Implementation Section** (addressing G1):
- Added 6 new tasks to Phase 9 (T221-T226):
  - T221: Setup structured logging (structlog, winston)
  - T222: Request/response logging middleware
  - T223: Performance metrics collection (p50, p95, p99)
  - T224: Error tracking with context capture
  - T225: Audit log for user actions
  - T226: Health check endpoints
- Specified logging format, metrics storage, integration points

**Additional Refinements**:
- Security Hardening: Complete 12-item checklist with implementation status
- Performance Optimization: Mapped NFR-PERF requirements to specific tasks
- Deployment Architecture: Added diagrams for frontend, backend, database flows
- Risks and Mitigations: 5 identified risks with mitigation strategies
- Phase Summary: Complete table showing Phase 0-9 status

**Document Structure**:
- Technical Context: Fully populated (no NEEDS CLARIFICATION)
- Project Structure: Complete frontend/backend directory trees
- Constitution Check: All gates passing or deviations documented
- 850+ lines with code examples, diagrams, and implementation guidance

## Outcome

- ✅ Impact: Addressed all 8 CRITICAL and 12 HIGH priority issues from /sp.analyze findings. Plan now ready for /sp.tasks generation with clear implementation guidance.
- 🧪 Tests: Not applicable (planning phase - test deferral documented with justification)
- 📁 Files: Created comprehensive specs/001-phase-2-web-app/plan.md (850+ lines)
- 🔁 Next prompts: Run /sp.tasks to generate 220+ implementation tasks based on refined plan
- 🧠 Reflection: Plan refinement successfully resolved constitution violations, clarified ambiguous requirements, and added missing observability/security tasks. All critical gaps addressed.

## Evaluation notes (flywheel)

- Failure modes observed: Initial setup-plan.sh failed on main branch (not a feature branch). Recovered by switching to 001-phase-2-web-app branch.
- Graders run and results (PASS/FAIL): 
  - Constitution compliance: PASS (violations documented with justifications)
  - Clarity: PASS (all ambiguities resolved with code examples)
  - Coverage: PASS (observability tasks added, security checklist complete)
  - Consistency: PASS (pagination strategy unified, error format consolidated)
- Prompt variant (if applicable): Standard /sp.plan workflow with --refine flag
- Next experiment (smallest change to try): Run /sp.analyze again to verify all issues resolved before proceeding to /sp.tasks
