---
layout: project
title: Edge Vision and Robotics QC Case Study - Real-Time Defect Rejection
description: Deep case study of an edge computer-vision quality-control system that scored defects in real time and triggered robotic rejection workflows.
permalink: /projects/edge-computer-vision-robotics-qc/
project_name: Edge Computer Vision and Robotics QC
project_subtitle: Real-time edge inspection system linking defect scoring directly to robotics rejection actions.
project_summary: "This system automated visual quality decisions on a live production line by combining camera-based scoring, threshold logic, and actuator control. The key objective was deterministic low-latency rejection with traceable decisions."
project_period: 2020 - 2021
project_stack:
  - OpenCV
  - Edge Computing
  - Robotics
  - GPIO
project_keywords:
  - edge quality inspection
  - computer vision defect rejection
  - robotics quality control pipeline
project_diagram: /assets/img/projects/architecture/edge-computer-vision-robotics-qc-architecture-diagram.svg
project_diagram_alt: Edge quality-control architecture graph showing camera capture, OpenCV scoring, reject actuation, and trace logging.
project_diagram_caption: "Architecture graph: camera frames are scored at the edge, rejection decisions trigger actuators, and events are logged for quality traceability."
image: /assets/img/projects/architecture/edge-computer-vision-robotics-qc-architecture-diagram.svg
image_alt: Edge computer vision and robotics quality-control architecture diagram.
---
## Problem
Manual inspection could not keep pace with throughput variability and introduced inconsistent reject decisions.

## Constraints
- Decision latency had to stay within the line cycle time.
- False positives had to be controlled to avoid unnecessary product waste.
- Every rejection event needed traceability for root-cause analysis.

## Architecture
- Edge execution close to cameras and actuators to minimize response latency.
- OpenCV-based feature extraction with threshold calibration tuned to product classes.
- GPIO actuation path for deterministic reject commands.
- Structured event logging to map visual evidence to reject actions.

## Tradeoffs and Failures
- Aggressive thresholds reduced escapes but increased false rejects.
- Conservative thresholds lowered waste but risked passing borderline defects.
- Lighting and camera-angle drift required ongoing recalibration.

## Engineering Impact
- Replaced manual spot checks with deterministic machine-assisted decisions.
- Connected inspection output directly to mechanical response.
- Improved post-incident debugging with decision logs tied to timestamps and events.

## Outcomes
- Faster reject loop under real line load.
- More consistent reject criteria across shifts.
- Better quality incident traceability and operational feedback.

## What Made This Approach Different
The design focused on closed-loop behavior (detect -> decide -> actuate -> log), not just model accuracy in isolation.
