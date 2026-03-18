---
layout: project
title: Examen Case Study - Angular and Spring Boot Reflective Journaling Platform
description: Deep case study of Examen, an open-source reflective journaling platform built with Angular SSR, Spring Boot, and PostgreSQL.
permalink: /projects/examen/
sitemap: false
noindex: true
project_name: Examen
project_subtitle: Structured reflection platform with analytics, reminders, and AI-assisted growth insights.
project_summary: "Examen is a production-style reflective journaling product where consistency mattered more than visual novelty. The implementation centers on a guided daily flow, strict session rules, and analytics that convert raw answers into actionable trends."
project_period: 2024 - 2025
project_stack:
  - Java
  - Spring Boot
  - Angular SSR
  - PostgreSQL
  - Docker
project_repo: https://github.com/reiidoda/examen
project_repo_anchor: Examen reflective journaling platform on GitHub
project_keywords:
  - reflective journaling platform
  - angular spring boot architecture
  - daily examination of conscience app
project_diagram: /assets/img/projects/architecture/examen-reflection-platform-architecture-diagram.svg
project_diagram_alt: Examen architecture graph showing Angular SSR frontend, Spring Boot API services, and PostgreSQL analytics storage.
project_diagram_caption: "Architecture graph: Angular SSR clients call the Spring Boot API, which orchestrates reflection workflows and writes analytics-ready data to PostgreSQL."
image: /assets/img/projects/architecture/examen-reflection-platform-architecture-diagram.svg
image_alt: Examen reflective journaling architecture diagram.
---
## Problem
Most journaling tools are either too open-ended or too rigid. The product goal was a guided reflection flow that users can repeat daily while still capturing useful data over time.

## Constraints
- Reflection sessions needed anti-spam controls (cooldown and active-session guard) so trends are reliable.
- Authentication and password reset flows had to be secure enough for real user accounts.
- The same domain logic had to support web UX, analytics, reminders, and export features without diverging models.

## Architecture
- Angular SSR for SEO-aware rendering, route-level UX speed, and content discoverability.
- Spring Boot service layer separated by controllers, DTOs, services, and repositories to keep business rules explicit.
- PostgreSQL + Flyway migrations for deterministic schema evolution and environment consistency.
- Docker Compose for repeatable local setup across frontend, backend, and database.

## Tradeoffs and Failures
- SSR improved SEO and first render quality, but increased build/runtime complexity versus SPA-only delivery.
- Strict session guards improved data quality, but initially felt restrictive for users testing the app.
- Reminder and email flows introduced operational overhead (SMTP configuration and rate-limit tuning).

## Engineering Impact
- Converted unstructured journaling into a domain model with stable entities (sessions, answers, categories, trends).
- Established reusable API contracts for profile analytics, growth endpoints, and reminder workflows.
- Reduced manual ops friction with migration-based schema control and containerized deployment.

## Outcomes
- End-to-end full-stack delivery with production-grade concerns (auth, rate limits, migrations, health checks).
- Higher consistency in reflection data due to workflow constraints and guided prompts.
- Platform extensibility: habits, gratitude, notifications, and analytics were added without reworking core entities.

## What Made This Approach Different
The system was designed as a behavior product first and a CRUD app second. Architectural decisions prioritized daily repeatability, data reliability, and long-term trend quality over feature count.
