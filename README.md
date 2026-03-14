# AI Genius Episode 2 — SpecKit: Agentic DevOps

> **Turn Specs into CI/CD Using GitHub Actions**
>
> A hands-on streaming demo showing how agentic AI patterns can automate
> DevOps workflows — from writing a spec file to a fully generated, running
> GitHub Actions pipeline.

---

## 📋 Session Overview

DevOps automation shouldn't stop at scripts and static rules.
In this episode you'll learn how to apply **agentic AI** to DevOps workflows,
turning specifications into intelligent CI/CD pipelines using **SpecKit** and
**GitHub Actions**.

### You Will Learn

- How agentic patterns apply to modern DevOps scenarios
- How to turn specs into CI/CD workflows using SpecKit
- How GitHub Actions can support agent‑driven pipelines
- Ways to improve delivery speed and reliability with intelligent automation

### Technologies Used

| Technology | Role |
|---|---|
| **SpecKit** | Spec parser, validator, and pipeline generator |
| **GitHub Actions** | CI/CD runner and agentic workflow host |
| **Node.js 20** | Runtime for the sample app and SpecKit engine |
| **Express.js** | Sample application API |
| **js-yaml** | YAML parsing for specs |
| **Jest** | Testing framework |

---

## 🗂️ Project Structure

```
ai-genius-ep2-speckit/
│
├── specs/
│   └── app.spec.yaml          # 🎯 THE SPEC — change this to change the pipeline
│
├── src/
│   ├── app.js                 # Sample Express.js API application
│   └── routes/
│       └── health.js          # Health-check route
│
├── speckit/
│   ├── index.js               # SpecKit CLI entry point
│   └── lib/
│       ├── parser.js          # Reads & parses spec YAML files
│       ├── validator.js       # Validates spec structure & values
│       └── pipeline-generator.js  # 🧠 Agentic: turns spec into pipeline YAML
│
├── tests/
│   ├── app.test.js            # Express app tests
│   └── speckit.test.js        # SpecKit engine tests (32 tests)
│
└── .github/
    └── workflows/
        ├── ci.yml                    # Standard CI workflow
        ├── spec-driven-pipeline.yml  # 🤖 Agentic spec-driven pipeline
        └── generate-pipeline.yml     # Auto-generates pipeline when spec changes
```

---

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/qkfang/ai-genius-ep2-speckit
cd ai-genius-ep2-speckit
npm install

# 2. Validate your spec
npm run speckit:validate

# 3. Generate a pipeline from the spec
npm run speckit:generate

# 4. Run the full SpecKit demo
node speckit/index.js run specs/app.spec.yaml

# 5. Start the sample API
npm start
```

---

## 🧠 How SpecKit Works — The Agentic Pattern

SpecKit implements a three-step agentic loop:

```
┌─────────────────────────────────────────────────────────────────┐
│                    SpecKit Agentic Loop                         │
│                                                                 │
│   1. PERCEIVE      2. REASON         3. ACT                     │
│   ───────────      ──────────        ───────                    │
│   Read spec   →   Validate &    →   Generate pipeline  →       │
│   YAML file       analyze stages    GitHub Actions YAML         │
│                                                                 │
│                    ↑                                            │
│                    └── Spec changes → loop again                │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Define Your Spec (`specs/app.spec.yaml`)

```yaml
name: my-app
runtime: node
runtimeVersion: "20"

stages:
  - name: Lint
    type: lint

  - name: Test
    type: test
    coverage: true
    coverageThreshold: 80

  - name: Deploy Staging
    type: deploy
    environment: staging
    strategy: blue-green
```

### Step 2: SpecKit Reasons Over the Spec

The **pipeline generator** (`speckit/lib/pipeline-generator.js`) reads each
stage and decides what GitHub Actions steps to emit:

| Stage type | Inferred steps (Node.js) |
|---|---|
| `lint` | `npm run lint` |
| `build` | `npm ci` + `npm run build` |
| `test` | `npm test` or `npm run test:coverage` |
| `security` | `npm audit` + Gitleaks + CodeQL note |
| `deploy` | Deploy script + health check + rollback |
| `notify` | Notification step (always runs) |

### Step 3: Run or Generate

```bash
# Validate the spec
node speckit/index.js validate specs/app.spec.yaml

# Generate a GitHub Actions workflow YAML
node speckit/index.js generate specs/app.spec.yaml --output .github/workflows/generated.yml

# Run the full agentic loop with a summary
node speckit/index.js run specs/app.spec.yaml
```

---

## 🔄 GitHub Actions Workflows

### 1. `ci.yml` — Standard CI

Runs on every push/PR: lint → build → test with coverage upload.

### 2. `spec-driven-pipeline.yml` — Agentic Spec-Driven Pipeline ⭐

The core demo workflow. It:

1. **Reads** `specs/app.spec.yaml`
2. **Validates** the spec with SpecKit
3. **Parses outputs** — decides which jobs to run based on spec contents
4. **Conditionally runs** security, deploy, and notify stages based on spec

Key agentic features:
- The `spec-analysis` job outputs facts (has_deploy, has_security) used by other jobs
- Downstream jobs use `if:` conditions based on spec analysis outputs
- Triggering with `workflow_dispatch` lets you pass a different spec file

### 3. `generate-pipeline.yml` — Self-Updating Pipeline

When `specs/app.spec.yaml` changes, this workflow:
1. Runs SpecKit to regenerate the pipeline YAML
2. Opens a pull request with the new workflow

This closes the agentic loop: **change the spec → pipeline updates automatically**.

---

## 🎯 Demo Walkthrough (1 hour)

### Part 1 — Introduction (0–10 min)
- What is agentic DevOps?
- The SpecKit architecture overview
- Why specs beat hand-written pipeline YAML

### Part 2 — The Spec File (10–25 min)
- Tour `specs/app.spec.yaml`
- Add a new stage (e.g., change `test` to add `coverage: true`)
- Run `node speckit/index.js validate` and see immediate feedback

### Part 3 — SpecKit Engine (25–40 min)
- Walk through `speckit/lib/pipeline-generator.js`
- Show how each stage type maps to GitHub Actions steps
- Run `node speckit/index.js generate` and inspect the output YAML

### Part 4 — GitHub Actions Integration (40–55 min)
- Tour `.github/workflows/spec-driven-pipeline.yml`
- Show the `spec-analysis` job and its outputs
- Demonstrate conditional jobs (`if: needs.spec-analysis.outputs.has_security == 'true'`)
- Trigger `workflow_dispatch` with a custom spec file

### Part 5 — Live Demo: Change Spec → Pipeline Adapts (55–60 min)
- Remove a stage from `app.spec.yaml`
- Commit and push
- Watch `generate-pipeline.yml` open a PR with the updated workflow

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run only SpecKit tests
npx jest tests/speckit.test.js

# Run only app tests
npx jest tests/app.test.js
```

All 32 tests should pass:
- **SpecKit Parser** — 6 tests
- **SpecKit Validator** — 9 tests
- **SpecKit Pipeline Generator** — 13 tests
- **Express App** — 4 tests

---

## ⚙️ SpecKit CLI Reference

```
Usage: speckit [options] [command]

Agentic DevOps: turn specs into CI/CD pipelines

Options:
  -V, --version              output version number
  -h, --help                 display help for command

Commands:
  validate <spec>            Validate a SpecKit spec file
  generate <spec> [options]  Generate a GitHub Actions workflow from a spec file
  run <spec>                 Validate and generate a pipeline, printing a full summary
  help [command]             display help for command
```

### `speckit generate` options

| Option | Description |
|---|---|
| `-o, --output <file>` | Write workflow to this file path |
| `--dry-run` | Print workflow to stdout without writing to disk |

---

## 📝 Spec File Reference

```yaml
# Required fields
name: string              # Application name
runtime: node|python|java|go|dotnet
stages: []                # At least one stage required

# Optional fields
description: string
version: string
runtimeVersion: string    # e.g. "20", "3.11", "21"

pipeline:
  name: string            # Workflow display name
  triggers:               # GitHub Actions trigger config (raw 'on:' syntax)
    push:
      branches: [main]
    pull_request:
      branches: [main]
    workflow_dispatch:

# Stage fields
stages:
  - name: string          # Required — becomes the job ID
    type: lint|build|test|security|deploy|notify  # Required
    commands: []          # Optional custom commands
    coverage: true/false  # (test stage) Enable coverage reporting
    coverageThreshold: 80 # (test stage) Minimum coverage %
    scanDependencies: true # (security) Run dependency audit
    scanSecrets: true      # (security) Run secrets scan
    codeql: true           # (security) Note about CodeQL
    environment: staging   # (deploy) REQUIRED for deploy stages
    strategy: blue-green|canary|direct  # (deploy) Deployment strategy
    healthCheck: true      # (deploy) Add health check step
    rollback: true         # (deploy) Add rollback configuration step
    channel: slack         # (notify) Notification channel name
    condition: string      # GitHub Actions if: condition
    needs: []              # Override default sequential ordering
```

---

## 🤝 Who Should Attend

- DevOps engineers and platform engineers
- Developers working with GitHub‑based CI/CD
- Teams looking to automate from specs to delivery
- Anyone interested in smarter, AI‑driven DevOps workflows
