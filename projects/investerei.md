---
layout: project
title: InvesteRei Case Study - AI Investing Platform with Human Approval
description: Deep case study of InvesteRei, a microservice AI investing platform with explicit approve or decline control before trade execution.
permalink: /projects/investerei/
project_name: InvesteRei
project_subtitle: AI-assisted portfolio automation platform with explicit human approval and enterprise-style brokerage workflows.
project_summary: "InvesteRei combines algorithmic decision support with a strict human-approval execution model. The architecture separates proposal intelligence from execution rails so automation can scale without removing user control."
project_period: 2026 - Present
project_stack:
  - Java
  - Spring Boot
  - Angular
  - Flutter
  - Redis
  - PostgreSQL
project_repo: https://github.com/reiidoda/InvesteRei
project_repo_anchor: InvesteRei AI investing platform on GitHub
project_keywords:
  - ai investing platform
  - human approval trade workflow
  - spring boot microservices wealth management
project_diagram: /assets/img/projects/architecture/investerei-ai-investing-platform-architecture-diagram.svg
project_diagram_alt: InvesteRei architecture graph showing client apps, gateway, core portfolio and AI services, and external broker integrations.
project_diagram_caption: "Architecture graph: web and mobile clients connect through a gateway to portfolio, risk, simulation, and execution services that integrate with broker and market data providers."
image: /assets/img/projects/architecture/investerei-ai-investing-platform-architecture-diagram.svg
image_alt: InvesteRei AI investing platform architecture diagram.
---
## Problem
Many automated investing products optimize speed but hide execution logic and risk controls from users.

## Constraints
- Any trade execution required explicit user approval to preserve trust and compliance posture.
- Portfolio and risk calculations had to remain explainable across web and mobile surfaces.
- Broker integrations needed a modular design to support multiple providers and market-data sources.

## Architecture
- Microservice split for auth, portfolio, simulation, AI forecasting, and execution orchestration.
- Spring Cloud gateway with JWT validation and Redis-backed rate limiting.
- Evented workflows for notification delivery, simulation jobs, and execution intent lifecycle.
- Shared domain contracts across Angular and Flutter clients for consistent product behavior.

## Tradeoffs and Failures
- Service decomposition improved scalability but introduced distributed tracing and orchestration complexity.
- Human approval checkpoints reduced operational risk but added latency to rapid-trade scenarios.
- Broker integration breadth increased product value while raising adapter maintenance cost.

## Engineering Impact
- Built a full proposal-to-execution chain with auditable approval events.
- Unified risk, simulation, and order-intent workflows in a consistent architecture.
- Delivered enterprise-style modules (watchlists, alerts, statements, research) over shared service foundations.

## Outcomes
- Repeatable local stack and service-level separation for feature growth.
- Stronger user-control guarantees through explicit approve or decline decision gates.
- Higher architecture readiness for production concerns: audits, retries, quotas, and provider failover.

## What Made This Approach Different
Instead of "fully automatic trading," the platform is "automation with controlled execution." That design choice shaped every technical decision from API contracts to UX and audit trails.
