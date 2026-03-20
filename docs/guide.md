# AI Genius Season 4 Episode 2 — Spec-Kit with GitHub Copilot

> **Hands-On Session: Spec-Driven Development using Spec-Kit and GitHub Copilot**
>
> This guide walks you through using [Spec-Kit](https://github.com/github/spec-kit) to
> design and build the AI Genius application — a Node.js API backend and a React web
> frontend — then deploy both to Azure using Bicep and GitHub Actions CI/CD.
>
> **Core message:** Specifications become the source of truth. Code is their expression.
> Deployment is the outcome.

---

## 🗺️ Session Overview

| Step | Topic |
|------|-------|
| [Step 1](#step-1--install-specify-cli) | Install Specify CLI |
| [Step 2](#step-2--define-your-constitution) | Define Your Constitution (`/speckit.constitution`) |
| [Step 3](#step-3--create-the-spec) | Create the Spec (`/speckit.specify`) |
| [Step 4](#step-4--clarify-the-spec) | Clarify the Spec (`/speckit.clarify`) |
| [Step 5](#step-5--validate-the-spec) | Validate the Spec (`/speckit.checklist`) |
| [Step 6](#step-6--create-a-technical-implementation-plan) | Create Implementation Plan (`/speckit.plan`) |
| [Step 7](#step-7--generate-tasks) | Generate Tasks (`/speckit.tasks`) |
| [Step 8](#step-8--analyze-and-validate) | Analyze and Validate (`/speckit.analyze`) |
| [Step 9](#step-9--implement) | Implement (`/speckit.implement`) |
| [Step 10](#step-10--cicd-deploy-to-azure) | CI/CD Deploy to Azure (Bicep + GitHub Actions) |

---

## Prerequisites

Before starting, make sure you have:

- **GitHub Copilot** subscription (individual, Business, or Enterprise)
- **Python 3.8+** with `uv` (for installing Specify CLI)
- **Node.js 20+** and `npm`
- **Azure CLI** (`az`) — authenticated via `az login`
- **Git** configured locally
- The repository cloned locally or opened in GitHub Codespaces

```bash
# Verify prerequisites
node --version   # >= 20
python --version # >= 3.8
az --version     # any recent version
git --version
```

Install `uv` if you don't have it:

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## Step 1 — Install Specify CLI

The `specify` CLI scaffolds the spec-kit file structure and installs the `/speckit.*`
slash commands into your AI agent. For GitHub Copilot, this writes prompt files into
`.github/copilot-instructions.md` and the `.github/` commands directory.

### Option A: Persistent Installation (Recommended)

Install once, use everywhere:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Then initialise the project (run from the repo root):

```bash
# Initialise spec-kit in the current directory for GitHub Copilot
specify init . --ai copilot
```

### Option B: One-time Initialisation

Run directly without a global install:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai copilot
```

### Force PowerShell scripts (Windows)

```bash
specify init . --ai copilot --script ps
```

### Verify the installation

```bash
specify check
```

After initialisation, Copilot gains these slash commands in its context:

| Command | Purpose |
|---------|---------|
| `/speckit.constitution` | Define project governing principles |
| `/speckit.specify` | Describe what to build |
| `/speckit.clarify` | Resolve ambiguities in the spec |
| `/speckit.checklist` | Validate spec completeness |
| `/speckit.plan` | Create a technical implementation plan |
| `/speckit.tasks` | Generate an actionable task list |
| `/speckit.analyze` | Cross-artifact consistency check |
| `/speckit.implement` | Execute all tasks |

> **Context Awareness:** Spec-Kit commands automatically detect the active feature based
> on your current Git branch (e.g., `001-aigenius-app`). Switch features by switching branches.

---

## Step 2 — Define Your Constitution

**In GitHub Copilot Chat**, use `/speckit.constitution` to establish the governing
principles for this project. The constitution is committed to `specs/constitution.md` and
guides every subsequent specification and implementation decision.

```
/speckit.constitution This project is the AI Genius demo application.
It consists of a Node.js Express API backend and a React frontend.
Core principles:
- Security-first: all inputs validated, HTTPS only, no secrets in code.
- Cloud-native: infrastructure is defined as code using Azure Bicep.
- CI/CD-driven: every merge to main triggers automated build and deployment.
- Simplicity: prefer standard libraries, avoid over-engineering.
- Tested: API routes must have unit tests; frontend must build clean.
```

Copilot will generate `specs/constitution.md` with your project's articles and principles.
Review and commit it.

---

## Step 3 — Create the Spec

**In GitHub Copilot Chat**, use `/speckit.specify` to describe what you want to build.
Focus on the **what** and **why** — not the tech stack.

Spec-Kit will:
1. Automatically determine the next feature number (e.g., `001`)
2. Create a feature branch (`001-aigenius-app`)
3. Generate `specs/001-aigenius-app/spec.md` from the template

```
/speckit.specify Build the AI Genius application.
The application has two parts:
1. A REST API that exposes a health endpoint and a status endpoint showing
   the runtime environment, current timestamp, and application version.
2. A React web frontend that displays the application name, links to the API
   endpoints, and shows the live status returned by the API.
Both components must be deployable to Azure — the API to Azure App Service
and the frontend to Azure Static Web Apps. Infrastructure must be defined
as Bicep templates so environments can be reproduced reliably.
```

Inspect the generated spec:

```bash
cat specs/001-aigenius-app/spec.md
```

---

## Step 4 — Clarify the Spec

**In GitHub Copilot Chat**, use `/speckit.clarify` to resolve any ambiguities.
Run it once with a general focus, then again with specific concerns.

**First pass — general clarification:**

```
/speckit.clarify Resolve all [NEEDS CLARIFICATION] markers in the spec.
For the API: the health endpoint returns HTTP 200 with JSON { "status": "ok" }.
The status endpoint returns the Node.js environment, timestamp, and app version.
For the frontend: it calls the API status endpoint on load and renders the response.
There is no user authentication in this initial version.
```

**Second pass — deployment and security details:**

```
/speckit.clarify Focus on deployment and security requirements.
The API must run on Node.js 20 LTS. The App Service must enforce HTTPS only
and disable FTP. The Static Web App uses the Free tier for development and
Standard for production. All Azure resources are tagged with app, environment,
and managedBy=bicep.
```

Review `specs/001-aigenius-app/spec.md` after each clarify pass to confirm the
`[NEEDS CLARIFICATION]` markers are resolved.

---

## Step 5 — Validate the Spec

**In GitHub Copilot Chat**, use `/speckit.checklist` to run a quality check on
the specification before moving to implementation planning. This acts like a
unit test for the English requirements.

```
/speckit.checklist
```

Copilot will report on:

- ✅ No `[NEEDS CLARIFICATION]` markers remaining
- ✅ All requirements are testable and unambiguous
- ✅ Success criteria are measurable
- ✅ Non-functional requirements (performance, security) are defined
- ✅ Deployment target and environment strategy are specified

Address any failing checklist items before continuing.

---

## Step 6 — Create a Technical Implementation Plan

**In GitHub Copilot Chat**, use `/speckit.plan` to provide the tech stack and
architecture choices. Spec-Kit translates the business requirements into a
detailed technical implementation plan.

```
/speckit.plan
The API is a Node.js 20 Express application in src/aigenius-api.
The frontend is a React 18 app built with Vite in src/aigenius-web.
Azure infrastructure is defined in bicep/main.bicep using two modules:
  - bicep/modules/webapp.bicep: Azure App Service Plan (Linux B1) + Web App
  - bicep/modules/staticwebapp.bicep: Azure Static Web App (Free tier)
CI/CD is GitHub Actions. On every push to main:
  1. Run Bicep to provision/update infrastructure.
  2. Deploy the API to Azure App Service via zip deploy.
  3. Build the React app and deploy to Azure Static Web App.
Use OIDC (Workload Identity Federation) for Azure authentication — no
long-lived credentials stored as secrets.
```

Spec-Kit generates into `specs/001-aigenius-app/`:

| File | Contents |
|------|----------|
| `plan.md` | Full technical implementation plan |
| `data-model.md` | Data structures and API schemas |
| `contracts/` | API endpoint contracts |
| `research.md` | Library choices and rationale |
| `quickstart.md` | Key validation scenarios |

---

## Step 7 — Generate Tasks

**In GitHub Copilot Chat**, use `/speckit.tasks` to generate an actionable task
list from the implementation plan. Tasks are derived from the contracts, data
model, and test scenarios.

```
/speckit.tasks
```

Spec-Kit reads `plan.md` and supporting documents to produce
`specs/001-aigenius-app/tasks.md` with:

- Tasks ordered by dependency
- Independent tasks marked `[P]` (safe to run in parallel)
- References to which contract or data-model entity each task implements

Review `specs/001-aigenius-app/tasks.md` and adjust priorities if needed.

---

## Step 8 — Analyze and Validate

**In GitHub Copilot Chat**, use `/speckit.analyze` to run a cross-artifact
consistency check. This catches mismatches between the spec, plan, contracts,
and tasks before any code is written.

```
/speckit.analyze
```

Copilot will check:

- All API endpoints in `contracts/` are covered by tasks
- Data models referenced in the plan match the contracts
- The implementation phases have clear prerequisites and deliverables
- No speculative or "might need" features crept in

Address any inconsistencies reported before proceeding.

---

## Step 9 — Implement

**In GitHub Copilot Chat**, use `/speckit.implement` to execute the task list and
build the feature. For complex projects, implement in phases to avoid overwhelming
the agent's context.

```
/speckit.implement
```

> **Phased Implementation Tip:** For this project, consider two phases:
> - **Phase 1:** API — Express routes, health endpoint, status endpoint, tests
> - **Phase 2:** Frontend — React app, Vite config, API integration, build

After implementation, verify locally:

```bash
# Test the API
cd src/aigenius-api
npm ci
npm test
npm start        # Runs on http://localhost:3000

# Verify endpoints
curl http://localhost:3000/health
curl http://localhost:3000/api/status

# Build the frontend
cd ../aigenius-web
npm ci
npm run build    # Output in dist/
npm run preview  # Preview at http://localhost:4173
```

---

## Step 10 — CI/CD: Deploy to Azure

With the application built, set up automated deployment to Azure using the
`deploy.yml` GitHub Actions workflow and the Bicep templates in `bicep/`.

### 10.1 — Set up Azure OIDC Authentication

Instead of storing long-lived credentials, the workflow uses **OIDC (Workload Identity
Federation)** — GitHub's identity is federated directly to Azure.

```bash
# 1. Create a service principal
az ad app create --display-name "ai-genius-github-actions"
APP_ID=$(az ad app list --display-name "ai-genius-github-actions" --query "[0].appId" -o tsv)

# 2. Create the federated credential for the main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/YOUR_REPO:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# 3. Create the service principal and assign Contributor role
az ad sp create --id $APP_ID
SP_ID=$(az ad sp show --id $APP_ID --query id -o tsv)
az role assignment create \
  --assignee $SP_ID \
  --role Contributor \
  --scope /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/YOUR_RESOURCE_GROUP
```

### 10.2 — Configure GitHub Secrets and Variables

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

**Secrets:**

| Secret | Value |
|--------|-------|
| `AZURE_CLIENT_ID` | App registration client ID |
| `AZURE_TENANT_ID` | Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | *(Optional — only if not using Bicep output)* |

**Variables:**

| Variable | Example value |
|----------|---------------|
| `AZURE_RESOURCE_GROUP` | `rg-aigenius-prod` |
| `AZURE_LOCATION` | `eastus` |
| `APP_NAME` | `aigenius` |

### 10.3 — Deploy Bicep Infrastructure

The `deploy.yml` workflow provisions all Azure infrastructure in the `infra` job.
You can also run Bicep manually for the first-time setup:

```bash
# Log in to Azure
az login

# Create the resource group
az group create \
  --name rg-aigenius-dev \
  --location eastus

# Deploy infrastructure (development)
az deployment group create \
  --resource-group rg-aigenius-dev \
  --template-file bicep/main.bicep \
  --parameters appName=aigenius environment=development

# Deploy infrastructure (production)
az deployment group create \
  --resource-group rg-aigenius-prod \
  --template-file bicep/main.bicep \
  --parameters appName=aigenius environment=production appServicePlanSku=B1
```

**Resources provisioned by Bicep:**

| Resource | Bicep module | Purpose |
|----------|-------------|---------|
| Azure App Service Plan (Linux B1) | `modules/webapp.bicep` | Compute plan for the API |
| Azure App Service | `modules/webapp.bicep` | Hosts `src/aigenius-api` |
| Azure Static Web App | `modules/staticwebapp.bicep` | Hosts built `src/aigenius-web` |

### 10.4 — CI/CD Workflow: `deploy.yml`

The `deploy.yml` workflow triggers on every push to `main` and runs three jobs in order:

```
infra  ──┬──▶  deploy-api
         └──▶  deploy-web
```

**Job 1 — `infra`: Provision infrastructure via Bicep**

```yaml
- Azure Login (OIDC)
- Create resource group if it does not exist
- az deployment group create bicep/main.bicep
- Output: nodeAppName, staticWebAppToken
```

**Job 2 — `deploy-api`: Deploy Node.js API to Azure App Service**

```yaml
- npm ci --omit=dev          # production dependencies only
- zip src/aigenius-api/
- azure/webapps-deploy@v3    # zip deploy to App Service
```

**Job 3 — `deploy-web`: Build and deploy React app to Azure Static Web App**

```yaml
- npm ci && npm run build    # Vite produces dist/
- Azure/static-web-apps-deploy@v1
```

### 10.5 — Trigger a Deployment

Push to `main` to trigger the full pipeline automatically:

```bash
git add .
git commit -m "feat: initial AI Genius app"
git push origin main
```

Or trigger manually from the **Actions** tab:

1. Go to **Actions** → **Deploy to Azure**
2. Click **Run workflow**
3. Select the target environment (`staging` or `production`)
4. Click **Run workflow**

### 10.6 — Verify the Deployment

After the workflow completes, verify each component:

```bash
# Check App Service is running
curl https://aigenius-nodeapp-production.azurewebsites.net/health

# Expected response:
# { "status": "ok" }

curl https://aigenius-nodeapp-production.azurewebsites.net/api/status

# Expected response:
# { "status": "running", "environment": "production", "timestamp": "..." }
```

The Static Web App URL is printed in the **Bicep Outputs** section of the workflow
step summary. Open it in your browser to verify the frontend loads and calls the API.

---

## Project Structure

```
ai-genius-s4-ep2-speckit/
│
├── bicep/
│   ├── main.bicep                  # Orchestrates all modules
│   ├── README.md                   # Bicep usage reference
│   └── modules/
│       ├── staticwebapp.bicep      # Azure Static Web App
│       └── webapp.bicep            # Azure App Service + Plan
│
├── src/
│   ├── aigenius-api/               # Node.js Express API
│   │   ├── app.js                  # Express app (health, status endpoints)
│   │   ├── package.json
│   │   └── routes/
│   │       └── health.js
│   │
│   └── aigenius-web/               # React + Vite frontend
│       ├── index.html
│       ├── vite.config.js
│       ├── package.json
│       └── src/
│           ├── App.jsx
│           └── main.jsx
│
├── specs/                          # Generated by spec-kit (git-tracked)
│   ├── constitution.md             # Project governing principles
│   └── 001-aigenius-app/
│       ├── spec.md                 # Feature requirements
│       ├── plan.md                 # Technical implementation plan
│       ├── data-model.md           # Data structures
│       ├── contracts/              # API endpoint contracts
│       ├── research.md             # Library choices and rationale
│       ├── quickstart.md           # Validation scenarios
│       └── tasks.md                # Actionable task list
│
└── .github/
    └── workflows/
        ├── ci.yml                  # Build & test on every PR
        └── deploy.yml              # Provision Bicep + deploy to Azure on main
```

---

## Bicep Parameters Reference

| Parameter | Default | Description |
|-----------|---------|-------------|
| `appName` | `aigenius` | Base name for all Azure resources |
| `location` | resource group location | Azure region |
| `environment` | `development` | `development`, `staging`, or `production` |
| `appServicePlanSku` | `B1` | App Service Plan SKU (`F1`, `B1`, `B2`, `S1`) |
| `staticWebAppSku` | `Free` | Static Web App tier (`Free` or `Standard`) |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `specify init` fails | Ensure Python 3.8+ and `uv` are installed |
| `/speckit.*` commands not available in Copilot | Re-run `specify init . --ai copilot`; reload VS Code |
| `npm ci` fails in API | Check `node --version` is ≥ 18 |
| Vite build fails | Check `node --version` is ≥ 18; run `npm ci` first |
| `az login` fails | Check Azure CLI is installed and network allows Azure endpoints |
| Bicep deploy fails | Ensure the resource group exists and the service principal has Contributor role |
| App Service deploy fails | Verify `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` secrets are set |
| Static Web App deploy fails | Check `AZURE_STATIC_WEB_APPS_API_TOKEN` secret or Bicep output token |
| OIDC login fails | Confirm the federated credential `subject` matches your repo path exactly |

---

## Key Principles (from Spec-Driven Development)

> Read the full methodology at
> [github.com/github/spec-kit/blob/main/spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md)

- **Specifications as the Lingua Franca** — the spec is the source of truth; code is its expression
- **Executable Specifications** — precise enough to generate working systems
- **Continuous Refinement** — use `/speckit.clarify` and `/speckit.checklist` iteratively
- **Research-Driven Context** — `/speckit.plan` gathers technical context before implementation
- **Bidirectional Feedback** — production incidents feed back into spec evolution
