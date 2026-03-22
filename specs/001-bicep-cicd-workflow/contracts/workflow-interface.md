# Workflow Interface Contract

**Feature**: `001-bicep-cicd-workflow`  
**File**: `.github/workflows/deploy-infra.yml`  
**Date**: 2026-03-22

This document defines the public interface of the GitHub Actions workflow: its inputs, outputs, secrets, and the guarantees it provides to callers and downstream jobs.

---

## Triggers

| Trigger | Condition | Default environment |
|---------|-----------|---------------------|
| `push` | Branch `main` | `development` → `dev` |
| `workflow_dispatch` | Manual via GitHub UI | Input-driven (see below) |

---

## Inputs (`workflow_dispatch`)

| Input name | Type | Required | Default | Allowed values | Description |
|------------|------|----------|---------|----------------|-------------|
| `environment` | `choice` | No | `development` | `development`, `staging`, `production` | Target deployment environment. Mapped internally to Bicep short forms `dev` / `qa` / `prod`. |

---

## Required Secrets

These GitHub repository secrets must be configured before any run can succeed.

| Secret name | Description | Sensitive? |
|-------------|-------------|------------|
| `AZURE_CLIENT_ID` | Azure AD Application (client) ID for OIDC federated credential | No (identifier) |
| `AZURE_TENANT_ID` | Azure AD Tenant ID | No (identifier) |
| `AZURE_SUBSCRIPTION_ID` | Azure Subscription ID | No (identifier) |

> No passwords or client secrets are stored. Authentication uses OIDC workload identity federation exclusively.

---

## Job Outputs

The `infra` job emits these named outputs, consumable by sibling jobs via `needs.infra.outputs.<name>`.

| Output name | Type | Description | Availability |
|-------------|------|-------------|--------------|
| `app-service-name` | string | Default hostname of the deployed Azure Web App | Non-empty after every successful `infra` run |
| `static-web-app-token` | string | Deployment token for the Azure Static Web App | Non-empty after every successful `infra` run |

**Consumption example** (in `deploy-api` or `deploy-web`):

```yaml
jobs:
  deploy-api:
    needs: [infra]
    steps:
      - run: echo "Deploying to ${{ needs.infra.outputs.app-service-name }}"
  deploy-web:
    needs: [infra]
    steps:
      - run: echo "SWA token available: ${{ needs.infra.outputs.static-web-app-token }}"
```

---

## Environment Variables (workflow-level)

| Variable | Value | Description |
|----------|-------|-------------|
| `APP_NAME` | `aigenius` | Base name used to derive Azure resource names |
| `AZURE_LOCATION` | `eastus2` | Azure region for resource group and resources |

*Derived at runtime (set in `env-map` step)*:

| Variable | Derived from | Example |
|----------|-------------|---------|
| `ENV_SHORT` | `EnvironmentMapping` | `dev` |
| `AZURE_RESOURCE_GROUP` | `rg-aigenius-$ENV_SHORT` | `rg-aigenius-dev` |
| `PARAM_FILE` | `bicep/parameters.$ENV_SHORT.json` | `bicep/parameters.dev.json` |

---

## Concurrency Contract

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

- Only one workflow run is active per branch at any time.
- A new push to `main` while a run is in progress will cancel the in-flight run.

---

## Guarantees

| # | Guarantee | Failure mode |
|---|-----------|--------------|
| G1 | `deploy-api` and `deploy-web` never run if `infra` fails | GitHub Actions `needs:` dependency; failed `infra` causes downstream jobs to be skipped with status `skipped` |
| G2 | All provisioned Azure resources carry tags `app`, `environment`, `managedBy=bicep` | Tag definitions are in Bicep modules; pipeline will fail if Bicep validation fails |
| G3 | No long-lived Azure credential is stored | `azure/login@v2` with `id-token: write` — short-lived OIDC JWT exchanged at runtime |
| G4 | Stale runs are cancelled on new push | `concurrency.cancel-in-progress: true` |
| G5 | Missing parameter file causes immediate failure | `az deployment group create` exits non-zero before any Azure resource is mutated |

---

## Breaking Changes

Any of the following changes to this workflow constitute a **breaking change** and require a new spec:

- Renaming job outputs (`app-service-name`, `static-web-app-token`)
- Removing a trigger (`push` on `main` or `workflow_dispatch`)
- Removing or renaming required secrets
- Changing the `concurrency.group` key scheme
