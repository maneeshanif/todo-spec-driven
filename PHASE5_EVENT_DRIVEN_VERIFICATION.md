# Phase 5 Event-Driven Architecture - Verification Report

**Date**: 2026-09-26
**Status**: Pub/sub mechanism proven locally; cloud deployment still pending

---

## Why this doc exists

Before this verification, the Phase 5 event-driven pieces (Dapr pub/sub,
Kafka, and the 4 microservices) existed only as code. Per
`MICROSERVICES_LOCAL_TEST.md`, they had never actually been run together -
Kafka + Dapr in Minikube was skipped for local resource reasons. This meant
nobody had confirmed the wiring actually worked end-to-end.

It didn't. Running it surfaced 3 real bugs that would have silently broken
the feature in production. They're now fixed and verified. See commit
`8228bdd` for the code changes.

---

## Bugs found and fixed

1. **Pub/sub component name mismatch** - backend published events under a
   component named `pubsub-kafka`; all 4 microservices and the Helm/K8s
   Dapr component subscribed under `taskpubsub`. Neither side would ever
   have connected. Unified to `taskpubsub` everywhere (backend routes,
   `dapr-components/pubsub-kafka.yaml`, `helm/todo-app/templates/dapr-pubsub-prod.yaml`).

2. **Reminder topic mismatch** - backend published reminders to a topic
   called `reminder-events`; notification-service subscribed to `reminders`.
   Fixed to `reminders` on both sides.

3. **CloudEvents envelope not unwrapped** (the significant one) - Dapr
   wraps every published message as `{"data": {...}, "type":
   "com.dapr.event.sent", ...}`. All 4 consumer handlers
   (notification-service, recurring-task-service, audit-service,
   websocket-service) read fields directly off the top-level event instead
   of `event["data"]`. notification-service failed loudly (Pydantic
   validation error). **recurring-task-service and audit-service failed
   silently** - the mismatch looked like "not a completion event" and was
   silently dropped, meaning recurring tasks and the audit trail would
   never have worked in production, with no error anywhere. Fixed in all 4
   services.

---

## What was verified locally (and how)

Built a lightweight proof harness - `docker-compose.dapr-test.yml` +
`dapr-local-test/components/pubsub.yaml` - using Redpanda (Kafka-compatible
broker) and Dapr sidecar containers, deliberately avoiding Minikube/Strimzi
to fit in constrained local RAM (~3-4GB headroom).

| Flow | Result |
|---|---|
| `reminders` topic -> notification-service | ✅ Parsed correctly, sent notification, republished to `task-updates`. Full round trip through Redpanda, zero errors. |
| `task-events` (task.completed, recurring) -> recurring-task-service | ✅ Parsed correctly, calculated next occurrence date, attempted callback to backend (500 expected - backend wasn't part of this scoped test, not a bug). |
| `task-updates` -> websocket-service | ✅ Parsed correctly, broadcaster invoked (no connected clients, expected - no browser attached in this test). |
| `task-events` (task.completed) -> audit-service | ✅ Subscribed and parsed correctly. ⚠️ DB write itself not completed - see below. |

Each subscription was independently confirmed via Dapr sidecar logs
(`"app is subscribed to the following topics..."`) before publishing test
events with `curl` directly against each sidecar's Dapr HTTP API.

---

## What's still not verified

- **audit-service database write**: the Dapr/event-handling path is fully
  proven (subscribe, receive, unwrap, dispatch). The write itself wasn't
  completed in this session - local Postgres auth needed to be reset
  mid-session, and the DB write step wasn't re-run afterward. Re-running
  the same test in `docker-compose.dapr-test.yml` (audit-service) with a
  valid `DATABASE_URL` would close this out in a couple of minutes.
- **Full JWT + REST + real DB flow through the actual backend**: not run.
  The backend's JWT verification fetches JWKS live from the frontend's
  Better Auth server (`/api/auth/jwks`), which means testing a real
  authenticated `/api/tasks/{id}/complete` call requires the frontend
  running too, a signed-up user, and a real Better Auth login - a bigger
  RAM/setup ask than the scoped pub/sub proof above. Not attempted this
  session.
- **Cloud deployment** (DigitalOcean DOKS, Redpanda Cloud, GitHub Actions
  CI/CD): unchanged, still not done. See `specs/002-phase-5-cloud-deploy/tasks.md`
  for the specific unchecked tasks (T143, T144-A/B, T154, T155, T156, T160,
  T161).
- **Urdu/i18n bonus feature**: not started.

---

## Bottom line

The event-driven core of Phase 5 is no longer "unproven code sitting on
disk" - the actual pub/sub mechanism is demonstrated working end-to-end
locally, with the bugs that would have silently killed it in production
found and fixed before they reached the real deployment. What remains is
mostly infrastructure work (cloud accounts, CI secrets, DOKS) rather than
application logic risk.
