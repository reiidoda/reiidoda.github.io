---
layout: project
title: AUTOTREND-LOGISTICA Case Study - Enterprise Vehicle Operations and Fleet Visibility
description: Deep case study of an enterprise logistics platform for vehicle requests, workflow orchestration, localization, and internal fleet visibility.
permalink: /projects/autotrend-logistica/
project_name: AUTOTREND-LOGISTICA
project_subtitle: Enterprise logistics platform for vehicle operations, workflow orchestration, and internal fleet visibility.
project_summary: "AUTOTREND-LOGISTICA was designed for Autotrend to replace fragmented vehicle-movement processes with a structured logistics system across mobile and web. The platform coordinated requests, confirmations, planning, notifications, key-status tracking, and vehicle localization across internal departments under one operational model."
project_period: 2026
project_stack:
  - Java
  - Spring Boot
  - API Gateway
  - Microservices
  - PostgreSQL
  - Flyway
  - Expo
  - React Native
  - OCR-Assisted Tracking
  - Docker Compose
project_keywords:
  - enterprise logistics platform
  - vehicle workflow orchestration
  - internal fleet visibility
  - spring boot logistics microservices
  - ocr vehicle localization
project_diagram: /assets/img/projects/architecture/autotrend-logistica-architecture-diagram.svg
project_diagram_alt: AUTOTREND-LOGISTICA architecture diagram showing request intake, workflow orchestration, tracking evidence, and enterprise support services.
project_diagram_caption: "Architecture graph: vehicle requests flow through identity, logistics orchestration, tracking evidence, notifications, and analytics services for controlled execution."
image: /assets/img/projects/architecture/autotrend-logistica-architecture-diagram.svg
image_alt: AUTOTREND-LOGISTICA enterprise logistics architecture diagram.
---
## Problem
Autotrend needed a structured way to coordinate internal vehicle movement across logistics, commercial, workshop, administration, and IT without relying on fragmented manual processes.

## Constraints
- Workflows had to support different roles, permissions, and ownership boundaries across departments.
- Request execution needed explicit state transitions with accountability for planning, rescheduling, departure, arrival, completion, and cancellation.
- Vehicle records had to be enriched from operational activity through photo, GPS, and OCR-based evidence handling.

## Architecture
- Enterprise microservices split across API gateway, identity, logistics, tracking, notifications, analytics, and prioritization domains.
- Role-based access control with internal data ownership boundaries and Flyway-managed schema evolution.
- Mobile and web delivery for request creation, logistics coordination, confirmations, and execution tracking.
- Outbox, inbox, and DLQ reliability patterns to protect cross-service workflow delivery and recovery.

## Tradeoffs and Failures
- Strong workflow control improved auditability but required careful handling of exceptions and reschedules.
- Service separation improved maintainability and rollout readiness while increasing integration and contract-governance pressure.
- Evidence-rich localization improved fleet visibility but introduced additional review steps for image quality, OCR confidence, and GPS consistency.

## Engineering Impact
- Replaced ad hoc coordination with a controlled end-to-end request and confirmation lifecycle.
- Improved operational visibility through notifications, key-status tracking, and localization evidence flows.
- Established a backend foundation prepared for future infrastructure hardening and broader enterprise rollout.

## Outcomes
- Clearer accountability across status changes and handoffs between departments.
- Better internal visibility into vehicle location, planning state, and execution progress.
- More scalable logistics operations through explicit service boundaries and governed API contracts.

## What Made This Approach Different
The platform treated internal logistics as an operational system of record, not just a request board. Vehicle movement, confirmations, notifications, key tracking, and localization evidence all belonged to one controlled workflow model.
