# Research: Bicep CI/CD Workflow — Phase 0

**Branch**: `001-bicep-cicd-workflow` | **Date**: 2026-03-22

This document resolves all unknowns and NEEDS CLARIFICATION items identified during Technical Context analysis.

---

## 1. OIDC Authentication with `azure/login`

**Decision**: Use `azure/login@v2` with the `client-id` / `tenant-id` / `subscription-id` OIDC parameters (not the legacy `creds` JSON secret).

**Rationale**:
- `azure/login@v1` with `creds: ${{ secrets.AZURE_CREDENTIALS }}` stores a long-lived JSON credential containing a client secret — violates FR-003 and FR-009.
- `azure/login@v2` implements OAuth 2.0 workload identity federation: GitHub requests a short-lived OIDC JWT from `token.actions.githubusercontent.com`; Azure exchanges it for an access token. No secret ever touches GitHub's secret store.
- The three secrets stored (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) are non-sensitive identifiers, consistent with the spec Assumptions section.

**Required `permissions` block**:

```yaml
permissions:
  id-token: write   # Allow OIDC JWT request
  contents: read    # Allow checkout
```

> Must be set at the job level (or workflow level) — without `id-token: write` the login action cannot request a JWT and the step will silently fail.

**Azure-side pre-requisite** (documented, not implemented by this workflow):
1. Create an Azure AD App Registration (or Managed Identity).
2. Add a Federated Credential with subject: `repo:qkfang/ai-genius-s4-ep2-speckit:ref:refs/heads/main` (and equivalent subjects for each environment if using environment-protection rules).
3. Grant the app the `Contributor` role on the target resource group (or subscription, scoped to the three `rg-aigenius-*` groups).

**Alternatives considered**:
- `azure/login@v1` with JSON credential — rejected: stores long-lived secret.
- Self-hosted runner with Managed Identity — rejected: overkill for this project;  requires additional infra; the spec does not constrain runner type.

---

## 2. Environment Mapping (human-readable → Bicep short form)

**Decision**: Use a `bash` `case` statement in a dedicated workflow step (`id: env-map`), writing the short form to `$GITHUB_OUTPUT`. Subsequent steps reference `${{ steps.env-map.outputs.env_short }}`.

**Rationale**:
- The `workflow_dispatch` input values must be human-readable (`development`, `staging`, `production`) to match the spec (FR-002, Clarification answer).
- `bicep/main.bicep` has `@allowed(['dev', 'qa', 'prod'])` — passing the long form would cause an ARM validation error.
- A `case` statement is idiomatic bash, requires no third-party action, and is trivially readable.

**Mapping table**:

| Dispatch input | Bicep short form | Resource group |
|----------------|-----------------|----------------|
| `development`  | `dev`           | `rg-aigenius-dev` |
| `staging`      | `qa`            | `rg-aigenius-qa`  |
| `production`   | `prod`          | `rg-aigenius-prod` |

**Push trigger** defaults to `development` (→ `dev`) via `${{ github.event.inputs.environment || 'development' }}`.

**Alternatives considered**:
- GitHub Actions expression with nested ternary — rejected: not supported (Actions only supports a single ternary operator).
- Separate reusable workflow with `env` matrix — rejected: adds indirection for no gain at this scale.

---

## 3. Resource Group Creation (`az group create`)

**Decision**: Run `az group create --name $RG --location $LOCATION --if-not-exists` (or equivalently `az group create` which is idempotent) before `az deployment group create`.

**Rationale**:
- `az deployment group create` fails if the resource group does not exist (HTTP 404). FR-004 requires the pipeline to create it if missing.
- `az group create` is idempotent: if the group exists it returns HTTP 200 with no changes; if it doesn't exist it creates it and returns HTTP 201.
- No `--if-not-exists` flag is needed — the command itself is idempotent.

**Alternatives considered**:
- Using `az group exists` + conditional creation — rejected: more lines with no benefit; `az group create` already handles both cases.
- Creating the resource group in Bicep using a subscription-scoped deployment — rejected: adds a second deployment scope and complicates the single-file workflow.

---

## 4. Job Outputs — Capturing Bicep Deployment Results

**Decision**: Use `az deployment group show` (or capture the output of `az deployment group create` with `--query`) and write values to `$GITHUB_OUTPUT` using `echo "key=value" >> $GITHUB_OUTPUT`.

**Capture pattern**:

```bash
APP_SERVICE_NAME=$(az deployment group show \
  --resource-group "$RG" \
  --name "main-deploy" \
  --query "properties.outputs.nodeAppHostname.value" \
  --output tsv)
echo "app-service-name=$APP_SERVICE_NAME" >> $GITHUB_OUTPUT

SWA_TOKEN=$(az deployment group show \
  --resource-group "$RG" \
  --name "main-deploy" \
  --query "properties.outputs.staticWebAppToken.value" \
  --output tsv)
echo "static-web-app-token=$SWA_TOKEN" >> $GITHUB_OUTPUT
```

**Bicep output names** (from `bicep/main.bicep`):
- `nodeAppHostname` → maps to job output `app-service-name`
- `staticWebAppToken` → maps to job output `static-web-app-token`

**Job-level output declaration** (in the `infra` job):

```yaml
outputs:
  app-service-name:    ${{ steps.capture-outputs.outputs.app-service-name }}
  static-web-app-token: ${{ steps.capture-outputs.outputs.static-web-app-token }}
```

**Consumption in sibling jobs**:

```yaml
deploy-api:
  needs: [infra]
  steps:
    - run: echo "${{ needs.infra.outputs.app-service-name }}"
```

**Alternatives considered**:
- Parsing `az deployment group create` stdout with `jq` — viable, but requires `jq` to be installed; `--query` with Azure CLI JMESPath is simpler and always available.
- Writing to a shared artifact — rejected: unnecessary complexity for intra-workflow data passing.

---

## 5. Concurrency Control

**Decision**: Define a workflow-level `concurrency` block keyed on `github.ref` so that only one run per branch is active at a time; newer runs cancel in-flight runs.

```yaml
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
```

**Rationale**:
- Satisfies FR-013: newer commit on `main` must cancel the previous in-flight run.
- `github.ref` is `refs/heads/main` for push triggers and `refs/heads/<branch>` for dispatch — scoping is correct in both cases.
- Placing the block at the workflow level (not job level) ensures the whole workflow (including `deploy-api` and `deploy-web`) is cancelled, not just the `infra` job.

**Alternatives considered**:
- Job-level concurrency — rejected: would only cancel individual jobs, leaving orphaned downstream jobs.
- No concurrency control — rejected: violates FR-013 explicitly.

---

## 6. Per-Environment Parameter Files

**Decision**: Create `bicep/parameters.dev.json`, `bicep/parameters.qa.json`, and `bicep/parameters.prod.json`. Each file provides the full parameter set so the workflow can pass `--parameters @bicep/parameters.<env>.json` without any inline overrides.

**File schema** (ARM deployment parameters format):

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "appName":            { "value": "aigenius" },
    "environment":        { "value": "dev" },
    "appServicePlanSku":  { "value": "B1" },
    "staticWebAppSku":    { "value": "Free" }
  }
}
```

**Parameter differences per environment**:

| Parameter        | dev      | qa       | prod       |
|------------------|----------|----------|------------|
| `environment`    | `dev`    | `qa`     | `prod`     |
| `appServicePlanSku` | `B1`  | `B1`     | `B2`       |
| `staticWebAppSku` | `Free` | `Free`   | `Standard` |

**Rationale**: `prod` uses larger SKUs to meet production SLAs. All other parameters default to the `aigenius` application name and the region from the resource group.

**Alternatives considered**:
- Passing all parameters inline on the CLI — rejected: fragile; hard to review parameter changes in PRs.
- Using Bicep `.bicepparam` files — rejected: requires Bicep CLI (not just Azure CLI); complicates the `az deployment group create` command.

---

## 7. Workflow File Name and Job Structure

**Decision**: Create `.github/workflows/deploy-infra.yml` (per FR-011 and user input). The existing `infra-deploy.yml` will be superseded / deleted as part of implementation.

**Job structure**:

```
infra          → checkout + OIDC login + create RG + env-map + deploy Bicep + capture outputs
deploy-api     → needs: [infra] (placeholder; full implementation is a future feature)
deploy-web     → needs: [infra] (placeholder; full implementation is a future feature)
```

**Rationale**: FR-011 requires all three jobs in a single file. `deploy-api` and `deploy-web` are scaffolded with `needs: [infra]` to enforce sequencing and demonstrate output consumption, even if their step contents are minimal stubs pending their own feature specs.

---

## All NEEDS CLARIFICATION items resolved

| Item | Resolution |
|------|-----------|
| OIDC action version and parameters | `azure/login@v2` with `client-id`, `tenant-id`, `subscription-id` |
| How to capture Bicep outputs as job outputs | `az deployment group show --query` + `$GITHUB_OUTPUT` |
| Resource group creation strategy | `az group create` (idempotent — no extra guard needed) |
| Environment mapping mechanism | `bash` `case` statement → `$GITHUB_OUTPUT` |
| Concurrency mechanism | Workflow-level `concurrency` block with `cancel-in-progress: true` |
| Parameter file strategy | Three separate ARM parameter JSON files, one per environment |
