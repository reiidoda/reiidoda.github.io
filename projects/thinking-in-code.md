---
layout: project
title: thinking_in_code Case Study - PDF to Podcast Pipeline with Citations
description: Deep case study of thinking_in_code, a FastAPI and worker-based pipeline that transforms research PDFs into cited scripts and optional audio.
permalink: /projects/thinking-in-code/
project_name: thinking_in_code
project_subtitle: Local-first pipeline for turning research PDFs into citation-aware podcast scripts and audio artifacts.
project_summary: "thinking_in_code was built to eliminate the manual path from research paper to publishable audio. The design focuses on job reliability, citation traceability, and controllable generation quality across script and TTS stages."
project_period: 2025
project_stack:
  - Python
  - FastAPI
  - Redis
  - Pydantic
  - Docker
project_repo: https://github.com/reiidoda/thinking_in_code
project_repo_anchor: thinking_in_code PDF-to-podcast pipeline on GitHub
project_keywords:
  - PDF to podcast generator
  - citation aware script generation
  - FastAPI worker architecture
project_diagram: /assets/img/projects/architecture/thinking-in-code-pdf-podcast-architecture-diagram.svg
project_diagram_alt: thinking in code architecture graph from upload API and Redis queue to worker pipeline and generated artifacts.
project_diagram_caption: "Architecture graph: the API ingests PDFs and job metadata, workers execute extraction and generation stages, and artifacts are persisted per job."
image: /assets/img/projects/architecture/thinking-in-code-pdf-podcast-architecture-diagram.svg
image_alt: thinking in code PDF to podcast architecture diagram.
---
## Problem
Research-to-podcast workflows usually break on two points: preserving source evidence and producing outputs reliably at scale.

## Constraints
- Each script segment needed citation continuity to avoid unsupported claims.
- The job pipeline had to tolerate retries and partial failures without losing artifacts.
- The same architecture had to support local-first execution and containerized deployment.

## Architecture
- FastAPI service for upload, status, artifacts, and SSE progress endpoints.
- Queue-backed worker model (`dir`, `file`, or Redis) for asynchronous processing and backpressure control.
- Pydantic contracts shared across services for stable job and artifact schemas.
- Provider abstraction for LLM and TTS (Ollama/OpenRouter plus multiple speech backends).

## Tradeoffs and Failures
- Multi-provider flexibility increased portability but raised configuration complexity.
- High-quality audio assembly improved output quality but expanded runtime and dependency surface.
- Retrieval grounding improved evidence quality, but tuning chunking and context windows required repeated calibration.

## Engineering Impact
- Automated a previously manual pipeline from PDF ingestion to listener-ready outputs.
- Preserved citation metadata across extraction, generation, and quality checks.
- Added operational reliability patterns: idempotency keys, retry backoff, dead-letter handling, and job metrics.

## Outcomes
- Reproducible artifact set per job (`script`, `transcript`, quality reports, optional `episode.mp3`).
- Faster content throughput with measurable stage timings and quality logs.
- Clean architecture separation between API edges, worker orchestration, and core pipeline logic.

## What Made This Approach Different
The system treats content generation as an engineering pipeline, not a single prompt. Evidence retention, fault tolerance, and artifact observability are first-class design constraints.
