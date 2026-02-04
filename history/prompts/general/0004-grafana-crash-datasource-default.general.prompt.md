---
id: 0004
title: Grafana crash datasource default
stage: general
date: 2026-02-02
surface: agent
model: GPT-5.2-Codex
feature: none
branch: 002-phase-5-cloud-deploy
user: unknown
command: kubectl get configmap -n monitoring loki-loki-stack -o yaml
labels: [k8s,grafana,debug]
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

ok why grafahna pods is crashing again and again

## Response snapshot

Identified Grafana crash due to datasource provisioning error (multiple defaults). Patched Loki datasource ConfigMap to set `isDefault: false` and restarted Grafana pod, which reached 3/3 Ready.

## Outcome

- ✅ Impact: Grafana pod now starts and becomes Ready after datasource fix.
- 🧪 Tests: Not run (kubectl status checks only).
- 📁 Files: No repo files changed; cluster ConfigMap patched.
- 🔁 Next prompts: Verify Grafana UI and alerting datasources.
- 🧠 Reflection: Ensure only one datasource is marked default across Grafana datasource ConfigMaps.

## Evaluation notes (flywheel)

- Failure modes observed: Multiple Grafana datasources marked `isDefault: true` causing provisioning failure.
- Graders run and results (PASS/FAIL): Not run.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Persist fix via Helm values for Loki chart.
