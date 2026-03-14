# AI Genius Episode 2 — SpecKit: Step-by-Step Demo Guide

> **1-Hour Hands-On Session: Agentic DevOps — Turn Specs into CI/CD Using GitHub Actions**
>
> This guide is written for the presenter. Every step has been tested and timed.
> Follow the steps in order; each section includes the exact prompts, commands,
> and expected output so you can demo confidently and recover quickly if anything
> goes wrong.

---

## ⏱️ Session Timeline

| Section | Topic | Clock Time |
|---------|-------|-----------|
| [Part 1](#part-1--introduction-and-setup-010-min) | Introduction & Setup | 0 – 10 min |
| [Part 2](#part-2--explore-the-spec-file-1025-min) | Explore the Spec File | 10 – 25 min |
| [Part 3](#part-3--speckit-engine-deep-dive-2540-min) | SpecKit Engine Deep Dive | 25 – 40 min |
| [Part 4](#part-4--github-actions-integration-4055-min) | GitHub Actions Integration | 40 – 55 min |
| [Part 5](#part-5--live-change-spec--pipeline-adapts-5560-min) | Live Demo: Spec → Pipeline Adapts | 55 – 60 min |

---

## Prerequisites

Before the session starts, verify these are installed:

```bash
node --version   # must be >= 18 (ideally 20)
npm --version    # any recent version
git --version
```

You need:
- The repository cloned locally (or opened in GitHub Codespaces / VS Code Dev Container)
- A GitHub account with the repo forked (for the GitHub Actions live demo in Part 4–5)

---

## Part 1 — Introduction and Setup (0–10 min)

### Step 1.1 — Clone and install ⏱️ ~30 seconds

**What to say:**
> "Let's start from a clean clone — this is exactly what any new team member would do."

```bash
git clone https://github.com/qkfang/ai-genius-ep2-speckit
cd ai-genius-ep2-speckit
npm install
```

**Expected output (last lines):**
```
added 68 packages, and audited 69 packages in 3s
found 0 vulnerabilities
```

> **Timing note:** `npm install` takes ~3 seconds on a fresh clone (packages already cached) or ~15 seconds on first run.

---

### Step 1.2 — Tour the project structure ⏱️ ~3 minutes

**What to say:**
> "Here's how the project is organized. There are four main areas."

Open the project in your editor and walk through each folder, or run:

```bash
# Show the top-level structure
ls -1
```

**Point out:**

| Folder / File | Role |
|---|---|
| `specs/app.spec.yaml` | 🎯 **THE spec** — this is the only file you edit to change the pipeline |
| `speckit/` | The SpecKit engine: parser, validator, pipeline-generator |
| `src/` | Sample Express.js application |
| `tests/` | Jest test suite (32 tests) |
| `.github/workflows/` | GitHub Actions workflows |

**Key message:**
> "The big idea: instead of hand-writing GitHub Actions YAML, you write a simple spec file and let SpecKit generate the pipeline. Change the spec → the pipeline adapts. That's the agentic pattern."

---

### Step 1.3 — Verify everything works ⏱️ ~2 minutes

**What to say:**
> "Let's make sure all 32 tests pass before we touch anything."

```bash
npm test
```

**Expected output:**
```
Tests:       32 passed, 32 total
Test Suites: 2 passed, 2 total
Time:        ~1.3s
```

> **Timing note:** Tests run in ~1.3 seconds.

If any tests fail, stop and check that `npm install` ran successfully.

---

## Part 2 — Explore the Spec File (10–25 min)

### Step 2.1 — Open and read the spec ⏱️ ~3 minutes

**What to say:**
> "This YAML file is the single source of truth for your entire pipeline. Let's read it together."

Open `specs/app.spec.yaml` in your editor, or print it:

```bash
cat specs/app.spec.yaml
```

**Walk through each section out loud:**

1. **App metadata** — `name`, `description`, `version`
2. **Runtime** — `runtime: node`, `runtimeVersion: "20"` — SpecKit uses this to choose the right setup action and commands
3. **Pipeline triggers** — push to `main`/`develop`, pull requests, manual dispatch
4. **Stages** — 7 stages: Lint → Build → Test → Security Scan → Deploy Staging → Deploy Production → Notify

**Key talking point:**
> "Notice there's no GitHub Actions YAML here — no `runs-on`, no `uses: actions/checkout@v4`, no `steps`. The spec is a high-level description of *what* you want. SpecKit figures out *how* to do it."

---

### Step 2.2 — Validate the spec ⏱️ ~15 seconds

**What to say:**
> "Before generating anything, SpecKit can validate the spec for correctness."

```bash
npm run speckit:validate
```

**Expected output:**
```
🔍 SpecKit › Validating spec: .../specs/app.spec.yaml

✅ Spec is valid!
   Name:    ai-genius-speckit-demo
   Runtime: node
   Stages:  Lint → Build → Test → Security Scan → Deploy Staging → Deploy Production → Notify
```

> **Timing note:** Validation runs in ~0.15 seconds.

---

### Step 2.3 — Intentionally break the spec ⏱️ ~3 minutes (interactive demo)

**What to say:**
> "Let's see what happens when the spec has an error. I'll remove the `environment` field from a deploy stage — that's a required field."

Edit `specs/app.spec.yaml`. Comment out or remove the `environment: staging` line under "Deploy Staging":

```yaml
  - name: Deploy Staging
    type: deploy
    # environment: staging   ← temporarily remove this line
    strategy: blue-green
```

Then run validate again:

```bash
npm run speckit:validate
```

**Expected output:**
```
❌ Spec validation failed with 1 error(s):

  • Deploy stage "Deploy Staging" must specify an "environment"
```

**Key talking point:**
> "The validator catches the error immediately, before any CI job runs. This is fast feedback — the agentic system *perceives* the spec and *reasons* about its correctness."

**Restore the spec:**
```yaml
  - name: Deploy Staging
    type: deploy
    environment: staging   # ← put it back
    strategy: blue-green
```

Confirm it's valid again:
```bash
npm run speckit:validate
```

---

### Step 2.4 — Add a new stage to the spec ⏱️ ~4 minutes (live edit)

**What to say:**
> "Now let's add a new stage. I want a performance-testing step. I'll add it right after the Test stage."

Open `specs/app.spec.yaml` and add this block after the Test stage:

```yaml
  # ── Stage 3b: Performance Test ──────────────────────────────
  - name: Performance Test
    type: test
    commands:
      - echo "Running k6 load tests..."
      - echo "All thresholds passed"
```

Validate:
```bash
npm run speckit:validate
```

**Expected output:**
```
✅ Spec is valid!
   Stages:  Lint → Build → Test → Performance Test → Security Scan → Deploy Staging → Deploy Production → Notify
```

**Key talking point:**
> "The new stage instantly appears in the pipeline order. I didn't touch any workflow YAML — I just added 5 lines to the spec."

**Undo the change** (to keep the demo clean):
```yaml
# Remove the Performance Test stage you just added
```

---

## Part 3 — SpecKit Engine Deep Dive (25–40 min)

### Step 3.1 — Run the full SpecKit loop ⏱️ ~30 seconds

**What to say:**
> "The `run` command validates, generates, and prints a full summary — the complete agentic loop in one shot."

```bash
npm run speckit:run
```

**Expected output (abridged):**
```
╔══════════════════════════════════════╗
║         SpecKit — Agentic DevOps     ║
╚══════════════════════════════════════╝

📋 Processing spec: .../specs/app.spec.yaml

✅ Step 1/3 — Parse:    spec loaded successfully
✅ Step 2/3 — Validate: spec is valid
✅ Step 3/3 — Generate: pipeline generated

─── Pipeline Summary ──────────────────────────────
  App Name:  ai-genius-speckit-demo
  Runtime:   node 20
  Stages:    7
  ├─ [lint    ] Lint
  ├─ [build   ] Build
  ├─ [test    ] Test
  ├─ [security] Security Scan
  ├─ [deploy  ] Deploy Staging
  ├─ [deploy  ] Deploy Production
  └─ [notify  ] Notify
```

After the summary, the full generated GitHub Actions YAML is printed.

> **Timing note:** The entire loop runs in ~0.06 seconds.

---

### Step 3.2 — Walk through the pipeline generator ⏱️ ~5 minutes

**What to say:**
> "Let's look at the brain of SpecKit — the pipeline generator."

Open `speckit/lib/pipeline-generator.js` in your editor.

**Key sections to highlight:**

1. **`RUNNER_MAP`** (line ~14) — maps runtime → GitHub Actions runner
   ```javascript
   const RUNNER_MAP = {
     node: 'ubuntu-latest',
     dotnet: 'windows-latest',
     ...
   };
   ```

2. **`generateStageSteps()`** (line ~60) — the reasoning switch statement
   ```javascript
   switch (stage.type) {
     case 'lint':    return generateLintSteps(stage, spec);
     case 'test':    return generateTestSteps(stage, spec);
     case 'deploy':  return generateDeploySteps(stage, spec);
     ...
   }
   ```
   > "This switch is where the agent *reasons* — it looks at the stage type and decides which steps to emit."

3. **`generateTestSteps()`** (line ~125) — shows how options affect output
   ```javascript
   if (coverage) {
     steps.push({ run: 'npm run test:coverage' });  // ← coverage: true
   } else {
     steps.push({ run: 'npm test' });
   }
   ```
   > "The spec option `coverage: true` changes the generated command. The spec drives the behaviour."

4. **`generateDeploySteps()`** (line ~203) — shows strategy-aware deployment
   - `blue-green`, `canary`, `direct` strategies all use the same spec field
   - Health check and rollback steps are conditionally added

5. **`buildJobs()`** (line ~362) — sequential ordering
   ```javascript
   job.needs = [options.previousJobId];  // ← enforces Lint → Build → Test → ...
   ```

---

### Step 3.3 — Generate the pipeline to a file ⏱️ ~1 minute

**What to say:**
> "Let's generate the pipeline and look at the output file."

```bash
npm run speckit:generate
```

**Expected output:**
```
⚙️  SpecKit › Generating pipeline from: .../specs/app.spec.yaml

✅ Workflow written to: .../github/workflows/generated-pipeline.yml
   Stages: Lint → Build → Test → Security Scan → Deploy Staging → Deploy Production → Notify
```

> **Timing note:** Generation takes ~0.16 seconds.

Now open `.github/workflows/generated-pipeline.yml` in your editor and scroll through it.

**Point out:**
- `on:` triggers — taken directly from the spec `pipeline.triggers`
- Each stage → one job, named after the stage
- `needs:` chains — enforces sequential execution
- `if:` conditions — from the `condition:` field in the spec
- `environment:` blocks on deploy jobs
- The `always()` condition on the notify step

**Key talking point:**
> "120+ lines of GitHub Actions YAML, generated from a 90-line spec. And if I change the spec, I regenerate and get a new correct workflow — no manual edits needed."

---

### Step 3.4 — Dry-run for stdout only ⏱️ ~30 seconds

**What to say:**
> "You can also preview the output without writing a file — useful in CI."

```bash
node speckit/index.js generate specs/app.spec.yaml --dry-run
```

The YAML prints to stdout. No file is written.

---

### Step 3.5 — Walk through the validator ⏱️ ~2 minutes

Open `speckit/lib/validator.js`.

**Key points:**

- Required fields: `name`, `runtime`, `stages`
- Valid runtimes: `node | python | java | go | dotnet`
- Valid stage types: `build | test | lint | security | deploy | notify`
- Deploy stages must have `environment`

**Key talking point:**
> "The validator is the 'perceive' step in the agentic loop. It checks the spec is well-formed before the generator tries to act on it."

---

## Part 4 — GitHub Actions Integration (40–55 min)

### Step 4.1 — Overview of the three workflows ⏱️ ~2 minutes

**What to say:**
> "The repo ships with three GitHub Actions workflows. Let's look at each one."

Navigate to `.github/workflows/` in your editor (or on GitHub).

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push / PR | Standard CI: lint → build → test |
| `spec-driven-pipeline.yml` | push / PR / manual | ⭐ Agentic: reads the spec and conditionally runs jobs |
| `generate-pipeline.yml` | spec file changed | Self-updating: regenerates the pipeline when spec changes |

---

### Step 4.2 — Walk through `spec-driven-pipeline.yml` ⏱️ ~6 minutes

Open `.github/workflows/spec-driven-pipeline.yml`.

**Key sections to highlight:**

**The `spec-analysis` job:**
```yaml
spec-analysis:
  runs-on: ubuntu-latest
  outputs:
    has_deploy: ${{ steps.analyze.outputs.has_deploy }}
    has_security: ${{ steps.analyze.outputs.has_security }}
  steps:
    - name: Analyze spec
      id: analyze
      run: |
        # Reads the YAML spec and sets outputs
        ...
```
> "This job is the agent's perception step — it reads the spec and emits facts as job outputs."

**Conditional downstream jobs:**
```yaml
security:
  needs: [spec-analysis, test]
  if: needs.spec-analysis.outputs.has_security == 'true'
```
> "The `if:` condition uses the output from `spec-analysis`. If the spec has no security stage, this job is skipped entirely. The pipeline *adapts* to the spec."

**`workflow_dispatch` with spec input:**
```yaml
on:
  workflow_dispatch:
    inputs:
      spec_file:
        description: 'Path to spec file'
        default: 'specs/app.spec.yaml'
```
> "You can trigger this workflow manually and pass a different spec file — useful for testing new specs before merging."

**How to trigger manually on GitHub:**
1. Go to **Actions** tab in the repo
2. Select **"SpecKit Spec-Driven Pipeline"**
3. Click **"Run workflow"**
4. Optionally change the spec file path
5. Click **"Run workflow"**

---

### Step 4.3 — Walk through `generate-pipeline.yml` ⏱️ ~4 minutes

Open `.github/workflows/generate-pipeline.yml`.

**Key sections to highlight:**

**Trigger on spec changes:**
```yaml
on:
  push:
    paths:
      - 'specs/**.yaml'
      - 'specs/**.yml'
```
> "This workflow only runs when a spec file changes. It's not triggered by code changes."

**Regenerate and open a PR:**
```yaml
- name: Generate pipeline
  run: npm run speckit:generate

- name: Create Pull Request
  uses: peter-evans/create-pull-request@v6
  with:
    title: "chore: regenerate pipeline from spec"
    body: "Automated update: spec changed → pipeline regenerated by SpecKit"
```
> "This closes the agentic loop: change the spec → GitHub Actions runs → SpecKit regenerates the pipeline → a PR is opened with the new workflow. Zero manual steps."

---

### Step 4.4 — Run the sample API ⏱️ ~2 minutes

**What to say:**
> "The repo also includes a real Express.js app that the pipeline is meant to build and deploy. Let's start it."

```bash
npm start
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
📋 SpecKit Demo API ready
```

In a second terminal (or browser), test the endpoints:

```bash
# Root endpoint
curl http://localhost:3000/
# Returns: {"name":"AI Genius SpecKit Demo","version":"1.0.0",...}

# Health check
curl http://localhost:3000/health
# Returns: {"status":"healthy","uptime":...}

# API status
curl http://localhost:3000/api/status
# Returns: {"status":"running","environment":"development",...}
```

Stop the server with `Ctrl+C`.

> **Timing note:** Server starts in under 1 second.

---

### Step 4.5 — Run tests with coverage ⏱️ ~2 minutes

**What to say:**
> "The pipeline spec sets `coverageThreshold: 80`. Let's run the coverage report to see how the project stands."

```bash
npm run test:coverage
```

**Expected output (summary):**
```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   87.67 |    70.96 |      80 |   89.32 |
 speckit/lib           |   88.70 |    71.42 |   82.75 |   90.60 |
  parser.js            |     100 |      100 |     100 |     100 |
  pipeline-generator.js|   86.61 |    69.02 |   77.27 |   89.13 |
  validator.js         |   93.10 |       75 |     100 |   92.85 |
 src                   |      75 |     62.50 |      60 |      75 |
  app.js               |      75 |     62.50 |      60 |      75 |
 src/routes            |     100 |      100 |     100 |     100 |
  health.js            |     100 |      100 |     100 |     100 |
-----------------------|---------|----------|---------|---------|
Tests: 32 passed, 32 total
Time:  ~1.3s
```

> **Timing note:** Full coverage run takes ~1.3 seconds.

---

## Part 5 — Live Demo: Change Spec → Pipeline Adapts (55–60 min)

### Step 5.1 — Remove a stage and regenerate ⏱️ ~2 minutes

**What to say:**
> "The last demo — the full agentic loop live. I'll change the spec and watch the pipeline update."

Open `specs/app.spec.yaml`. Comment out the entire **Security Scan** stage:

```yaml
  # ── Stage 4: Security Scan ─────────────────────────────────
  # - name: Security Scan
  #   type: security
  #   scanDependencies: true
  #   scanSecrets: true
  #   codeql: true
```

Validate and regenerate:

```bash
npm run speckit:validate
npm run speckit:generate
```

**Expected validate output:**
```
✅ Spec is valid!
   Stages:  Lint → Build → Test → Deploy Staging → Deploy Production → Notify
```

Notice **Security Scan is gone**. Open `.github/workflows/generated-pipeline.yml` — there is no `security-scan` job. The `deploy-staging` job now `needs: [test]` directly.

**Key talking point:**
> "One comment in the spec, zero manual changes to the workflow. The pipeline adapted automatically."

---

### Step 5.2 — Swap deployment strategy ⏱️ ~2 minutes

**What to say:**
> "Now let's change the deployment strategy from `blue-green` to `canary` for staging."

In `specs/app.spec.yaml`, change:

```yaml
  - name: Deploy Staging
    type: deploy
    environment: staging
    strategy: canary    # ← was blue-green
```

Regenerate:

```bash
npm run speckit:generate
```

Open `.github/workflows/generated-pipeline.yml` and find the `deploy-staging` job. The deploy step now says:

```yaml
- name: Deploy to staging
  run: |
    echo "🚀 Deploying ai-genius-speckit-demo to staging"
    echo "📦 Strategy: canary"
```

**Key talking point:**
> "One word changed in the spec. The pipeline now uses canary deployment. No YAML knowledge required from the developer."

---

### Step 5.3 — Push and watch the GitHub Actions loop (live) ⏱️ ~2 minutes

**What to say:**
> "In a real setup, pushing this spec change would trigger `generate-pipeline.yml`, which runs SpecKit and opens a PR with the new workflow. Let me show you."

```bash
git add specs/app.spec.yaml
git commit -m "chore: update spec — canary staging, no security scan"
git push
```

On GitHub:
1. Go to the **Actions** tab
2. Watch **"Generate Pipeline from Spec"** workflow run (triggered by the spec file change)
3. After it completes, go to **Pull Requests** — a new PR will be open with the regenerated workflow

**Key talking point:**
> "This is the agentic loop closing: the spec changed, the agent perceived it, reasoned over it, and acted — opening a PR with a new pipeline. No human wrote any workflow YAML."

---

### Step 5.4 — Restore to original state ⏱️ ~1 minute

After the demo, restore the spec to its original state:

```bash
git checkout specs/app.spec.yaml
npm run speckit:validate
npm run speckit:generate
```

Confirm:
```
✅ Spec is valid!
   Stages:  Lint → Build → Test → Security Scan → Deploy Staging → Deploy Production → Notify
```

---

## Quick Reference — All Commands

| Command | What it does | Typical time |
|---------|-------------|-------------|
| `npm install` | Install all dependencies | ~3–15 s |
| `npm test` | Run all 32 Jest tests | ~1.3 s |
| `npm run test:coverage` | Tests + coverage report | ~1.3 s |
| `npm run lint` | ESLint check | ~0.4 s |
| `npm run speckit:validate` | Validate `specs/app.spec.yaml` | ~0.15 s |
| `npm run speckit:generate` | Generate pipeline YAML to `.github/workflows/generated-pipeline.yml` | ~0.16 s |
| `npm run speckit:run` | Full agentic loop: parse → validate → generate + summary | ~0.06 s |
| `npm start` | Start Express.js API on port 3000 | < 1 s |
| `node speckit/index.js validate specs/app.spec.yaml` | Same as speckit:validate | ~0.15 s |
| `node speckit/index.js generate specs/app.spec.yaml --dry-run` | Preview pipeline to stdout | ~0.16 s |
| `node speckit/index.js run specs/app.spec.yaml` | Full run with pipeline printed | ~0.06 s |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `npm install` fails | Check Node.js version: `node --version` must be ≥ 18 |
| Tests fail | Run `npm install` first; check for syntax errors in any spec edits |
| Validation fails after spec edit | Read the error message — it tells you exactly which field is wrong |
| Port 3000 already in use | `PORT=3001 npm start` |
| Generate overwrites existing workflow | Intended — the file is always regenerated from the spec |
| GitHub Actions workflow not triggered | Check the file paths in the `on.push.paths` filter |

---

## SpecKit CLI Reference

```
Usage: node speckit/index.js <command> <spec-file> [options]

Commands:
  validate <spec>              Validate a spec file
  generate <spec> [options]    Generate GitHub Actions workflow
    -o, --output <file>          Write to file (default: stdout)
    --dry-run                    Print to stdout without writing
  run <spec>                   Validate + generate + print full summary

Examples:
  node speckit/index.js validate specs/app.spec.yaml
  node speckit/index.js generate specs/app.spec.yaml --dry-run
  node speckit/index.js generate specs/app.spec.yaml -o .github/workflows/my-pipeline.yml
  node speckit/index.js run specs/app.spec.yaml
```

---

## Spec File Reference

```yaml
# ── Required ──────────────────────────────────────────────────
name: string                # App name
runtime: node|python|java|go|dotnet
stages:                     # At least one required
  - name: string            # Required — becomes the job ID
    type: lint|build|test|security|deploy|notify  # Required

# ── Optional top-level ────────────────────────────────────────
description: string
version: string
runtimeVersion: string      # e.g. "20", "3.11", "21"

pipeline:
  name: string              # Workflow display name
  triggers:                 # GitHub Actions 'on:' block
    push:
      branches: [main]
    pull_request:
      branches: [main]
    workflow_dispatch:

# ── Stage options (by type) ───────────────────────────────────
# test:
    coverage: true|false
    coverageThreshold: 80

# security:
    scanDependencies: true|false
    scanSecrets: true|false
    codeql: true|false

# deploy:
    environment: staging|production  # REQUIRED
    strategy: blue-green|canary|direct
    healthCheck: true|false
    rollback: true|false

# notify:
    channel: slack|teams|email

# any stage:
    commands: []            # Custom commands (overrides defaults)
    condition: string       # GitHub Actions if: expression
    needs: []               # Override sequential ordering
```
