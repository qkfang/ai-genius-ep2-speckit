# AI Genius Season 4 Episode 2 — Spec-Kit with GitHub Copilot

> **Spec-Driven Development with GitHub Copilot, then deploy to Azure using Bicep and GitHub Actions.**

---

## 📋 Overview

This repository demonstrates how to use [Spec-Kit](https://github.com/github/spec-kit) with
**GitHub Copilot** to design the AI Genius application spec-first, then deploy it to Azure
using **Bicep** (Infrastructure as Code) and **GitHub Actions** CI/CD.

**What you will do:**

1. Install the `specify` CLI and initialise spec-kit for GitHub Copilot
2. Use `/speckit.*` slash commands in Copilot Chat to define, clarify, plan, and implement the application
3. Deploy the Node.js API to **Azure App Service** and the React frontend to **Azure Static Web Apps** via GitHub Actions

---

## 🗂️ Project Structure

```
ai-genius-s4-ep2-speckit/
│
├── bicep/
│   ├── main.bicep                  # Orchestrates all Azure modules
│   └── modules/
│       ├── staticwebapp.bicep      # Azure Static Web App (React frontend)
│       └── webapp.bicep            # Azure App Service + Plan (Node.js API)
│
├── src/
│   ├── aigenius-api/               # Node.js Express API
│   └── aigenius-web/               # React + Vite frontend
│
├── specs/                          # Spec-Kit generated specs (git-tracked)
│
└── .github/
    └── workflows/
        ├── ci.yml                  # Build & test on every PR/push
        └── deploy.yml              # Provision Bicep + deploy to Azure on main
```

---

## ⚡ Quick Start

### 1. Install Specify CLI and set up GitHub Copilot commands

```bash
# Install uv (if needed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install specify (persistent)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Initialise spec-kit for GitHub Copilot in this directory
specify init . --ai copilot

# Verify
specify check
```

### 2. Use spec-kit slash commands in GitHub Copilot Chat

Open Copilot Chat and run the commands in order:

```
/speckit.constitution  <your project principles>
/speckit.specify       <what you want to build>
/speckit.clarify       <resolve ambiguities>
/speckit.checklist
/speckit.plan          <your tech stack>
/speckit.tasks
/speckit.analyze
/speckit.implement
```

### 3. Deploy to Azure

Configure the GitHub secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`)
and variables (`AZURE_RESOURCE_GROUP`, `APP_NAME`), then push to `main`:

```bash
git push origin main
```

The `deploy.yml` workflow will:
1. Run `bicep/main.bicep` to provision Azure infrastructure
2. Deploy `src/aigenius-api` to Azure App Service
3. Build and deploy `src/aigenius-web` to Azure Static Web App

---

## 🚀 GitHub Actions Workflows

| Workflow | Trigger | What it does |
|----------|---------|-------------|
| `ci.yml` | Push / PR | Lint, build, and test both `aigenius-api` and `aigenius-web` |
| `deploy.yml` | Push to `main` / manual | Provision Bicep infra, deploy API + web to Azure |

---

## 🔧 Local Development

```bash
# Run the API locally
cd src/aigenius-api
npm ci && npm start        # http://localhost:3000

# Run the React frontend locally
cd src/aigenius-web
npm ci && npm run dev      # http://localhost:5173
```

---

## 🧱 Azure Infrastructure (Bicep)

```bash
# Create resource group
az group create --name rg-aigenius-dev --location eastus

# Deploy all resources
az deployment group create \
  --resource-group rg-aigenius-dev \
  --template-file bicep/main.bicep \
  --parameters appName=aigenius environment=development
```

| Resource | Purpose |
|----------|---------|
| Azure App Service Plan (Linux B1) | Compute for the Node.js API |
| Azure App Service | Hosts `src/aigenius-api` |
| Azure Static Web App | Hosts built `src/aigenius-web` |

---

## 📖 Full Guide

See [`docs/guide.md`](docs/guide.md) for the complete step-by-step walkthrough,
including all `/speckit.*` command examples and the full Azure deployment setup.

---

## 🤖 Spec-Kit Slash Commands Reference

| Command | Description |
|---------|-------------|
| `/speckit.constitution` | Create or update project governing principles |
| `/speckit.specify` | Define what you want to build (requirements + user stories) |
| `/speckit.clarify` | Resolve underspecified areas before planning |
| `/speckit.checklist` | Validate spec completeness and clarity |
| `/speckit.plan` | Create technical implementation plan with your tech stack |
| `/speckit.tasks` | Generate actionable task list from the plan |
| `/speckit.analyze` | Cross-artifact consistency and coverage analysis |
| `/speckit.implement` | Execute all tasks and build the feature |

---

## 📄 License

MIT
