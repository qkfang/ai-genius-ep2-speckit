# Data Model: Bicep Infrastructure-as-Code CI/CD Pipeline

**Branch**: `001-bicep-cicd-workflow` | **Date**: 2026-03-22

This document describes every logical entity involved in the feature, their fields, relationships, and validation rules.

---

## Entities

### 1. `GithubActionsWorkflow`

The single automation file `.github/workflows/deploy-infra.yml`.

| Field | Type | Validation / Constraints |
|-------|------|--------------------------|
| `name` | string | `"Deploy Infrastructure to Azure"` |
| `on.push.branches` | string[] | `["main"]` |
| `on.workflow_dispatch.inputs.environment` | enum | `development \| staging \| production`; default `development` |
| `concurrency.group` | string | `"deploy-${{ github.ref }}"` — scoped per branch |
| `concurrency.cancel-in-progress` | bool | `true` |
| `jobs` | Job[] | Exactly three: `infra`, `deploy-api`, `deploy-web` |

**State transitions**:

```
triggered (push/dispatch)
  → infra: queued → in_progress → success/failure
      → deploy-api: queued → in_progress → success/failure  (needs: infra)
      → deploy-web: queued → in_progress → success/failure  (needs: infra)
```

---

### 2. `InfraJob`

The `infra` job within the workflow that performs all infrastructure provisioning.

| Field | Type | Validation / Constraints |
|-------|------|--------------------------|
| `name` | string | `"Deploy Bicep Infrastructure"` |
| `runs-on` | string | `ubuntu-latest` |
| `permissions.id-token` | string | `write` — required for OIDC |
| `permissions.contents` | string | `read` — required for checkout |
| `outputs.app-service-name` | string | Non-empty on success; value of `nodeAppHostname` Bicep output |
| `outputs.static-web-app-token` | string | Non-empty on success; value of `staticWebAppToken` Bicep output |

**Steps** (ordered):

| Step ID | Name | Action / Command |
|---------|------|-----------------|
| `checkout` | Checkout code | `actions/checkout@v4` |
| `azure-login` | Azure OIDC Login | `azure/login@v2` |
| `env-map` | Map environment name | `bash` `case` statement → `$GITHUB_OUTPUT` |
| `create-rg` | Create resource group | `az group create` |
| `deploy-bicep` | Deploy Bicep template | `az deployment group create` |
| `capture-outputs` | Capture job outputs | `az deployment group show --query` |

---

### 3. `EnvironmentMapping`

The translation of `workflow_dispatch` human-readable values to Bicep `@allowed` short forms.

| Input value | Short form | Resource group | Parameter file |
|-------------|------------|----------------|----------------|
| `development` | `dev` | `rg-aigenius-dev` | `bicep/parameters.dev.json` |
| `staging` | `qa` | `rg-aigenius-qa` | `bicep/parameters.qa.json` |
| `production` | `prod` | `rg-aigenius-prod` | `bicep/parameters.prod.json` |
| *(push trigger)* | `dev` | `rg-aigenius-dev` | `bicep/parameters.dev.json` |

**Validation rules**:
- The `case` statement must have an explicit `else` branch that exits with a non-zero code if an unmapped value is encountered.
- The short form must be set before `create-rg` and `deploy-bicep` steps execute.

---

### 4. `OidcFederatedCredential`

The Azure-side trust relationship enabling keyless authentication.

| Field | Type | Validation / Constraints |
|-------|------|--------------------------|
| `AZURE_CLIENT_ID` | GitHub secret | Non-empty; Azure AD Application (client) ID |
| `AZURE_TENANT_ID` | GitHub secret | Non-empty; Azure AD Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | GitHub secret | Non-empty; Azure Subscription ID |
| Subject (Azure) | string | `repo:qkfang/ai-genius-s4-ep2-speckit:ref:refs/heads/main` |

**Note**: These are non-sensitive identifiers stored as GitHub repository secrets for convenience (not credentials). Storing them as secrets is accepted practice and consistent with the spec Assumptions.

---

### 5. `BicepDeployment`

A resource-group–scoped ARM deployment of `bicep/main.bicep`.

| Field | Type | Validation / Constraints |
|-------|------|--------------------------|
| `name` | string | `main-deploy` (deterministic — enables `az deployment group show`) |
| `resource-group` | string | From `EnvironmentMapping.resourceGroup` |
| `template-file` | path | `bicep/main.bicep` |
| `parameters-file` | path | `bicep/parameters.<env>.json` |
| `mode` | string | `Incremental` (default; preserves resources not in template) |

**Outputs** (from Bicep template):

| Bicep output name | Type | Maps to job output |
|-------------------|------|--------------------|
| `nodeAppHostname` | string | `app-service-name` |
| `staticWebAppToken` | string | `static-web-app-token` |
| `staticWebAppUrl` | string | Not exposed as job output |
| `nodeAppResourceId` | string | Not exposed as job output |

---

### 6. `BicepParameterFile`

One of three JSON files providing environment-specific Bicep parameters.

| Field | Type | dev | qa | prod |
|-------|------|-----|----|------|
| `appName` | string | `aigenius` | `aigenius` | `aigenius` |
| `environment` | enum `dev\|qa\|prod` | `dev` | `qa` | `prod` |
| `appServicePlanSku` | enum `F1\|B1\|B2\|S1` | `B1` | `B1` | `B2` |
| `staticWebAppSku` | enum `Free\|Standard` | `Free` | `Free` | `Standard` |

**Validation rules**:
- All three files must exist before the workflow runs; a missing file causes `az deployment group create` to fail with an immediate file-not-found error.
- `environment` value must match the ARM-deployed tag value and the short-form from `EnvironmentMapping`.

---

### 7. `AzureResource` (tag contract)

Every Azure resource provisioned by the Bicep templates must carry these tags.

| Tag key | Required | Example value | Source |
|---------|----------|---------------|--------|
| `app` | ✅ | `aigenius` | `appName` Bicep parameter |
| `component` | ✅ | `node-app` / `frontend` | Hard-coded per module |
| `environment` | ✅ | `dev` / `qa` / `prod` | `environment` Bicep parameter |
| `managedBy` | ✅ | `bicep` | Hard-coded in module |

---

### 8. `JobOutput`

Named values emitted by the `infra` job and consumed by `deploy-api` and `deploy-web`.

| Output name | Source step | Source Bicep output | Consumer |
|-------------|-------------|---------------------|----------|
| `app-service-name` | `capture-outputs` | `nodeAppHostname` | `deploy-api` via `needs.infra.outputs.app-service-name` |
| `static-web-app-token` | `capture-outputs` | `staticWebAppToken` | `deploy-web` via `needs.infra.outputs.static-web-app-token` |

**Validation rules**:
- Both outputs must be non-empty on every successful run (SC-003).
- Outputs are plain strings; no masking is applied to `static-web-app-token` (per spec Clarification).

---

## Entity Relationships

```
GithubActionsWorkflow
  └── jobs
        ├── InfraJob  ──────────── uses ──→ OidcFederatedCredential
        │     ├── steps[env-map]  ─→ EnvironmentMapping
        │     ├── steps[deploy]   ─→ BicepDeployment
        │     │                         └── uses ──→ BicepParameterFile (1 of 3)
        │     │                               └── produces ──→ AzureResource (×3, tagged)
        │     └── outputs         ─→ JobOutput (×2)
        │
        ├── deploy-api   ── needs: [InfraJob] ── consumes: app-service-name
        └── deploy-web   ── needs: [InfraJob] ── consumes: static-web-app-token
```
