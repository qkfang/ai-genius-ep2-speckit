# Quickstart: Bicep CI/CD Workflow

**Feature**: `001-bicep-cicd-workflow` | **Date**: 2026-03-22

Get the infrastructure pipeline running end-to-end in four steps.

---

## Prerequisites

- Azure subscription with permission to create resource groups and assign Contributor role
- GitHub repository with Actions enabled (`qkfang/ai-genius-s4-ep2-speckit`)
- Azure CLI installed locally (for one-time setup only)

---

## Step 1 — Create the Azure AD App Registration and Federated Credential

```bash
# 1a. Create the app registration
APP_ID=$(az ad app create --display-name "ai-genius-cicd" --query appId -o tsv)

# 1b. Create a Service Principal for the app
az ad sp create --id $APP_ID

# 1c. Add a federated credential for the main branch
az ad app federated-credential create \
  --id $APP_ID \
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:qkfang/ai-genius-s4-ep2-speckit:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

---

## Step 2 — Grant the App Contributor Access

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Grant Contributor on the subscription (scoped to rg-aigenius-* resource groups in practice)
az role assignment create \
  --assignee $APP_ID \
  --role Contributor \
  --scope /subscriptions/$SUBSCRIPTION_ID
```

> For least-privilege, scope the assignment to the three resource groups (`rg-aigenius-dev`, `rg-aigenius-qa`, `rg-aigenius-prod`) once they exist, or at the subscription level to allow the pipeline to create them.

---

## Step 3 — Add GitHub Repository Secrets

In your GitHub repository → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|-------------|-------|
| `AZURE_CLIENT_ID` | `$APP_ID` (from Step 1a) |
| `AZURE_TENANT_ID` | `$(az account show --query tenantId -o tsv)` |
| `AZURE_SUBSCRIPTION_ID` | `$(az account show --query id -o tsv)` |

---

## Step 4 — Trigger the Pipeline

**Automatic** (normal workflow):
```bash
git commit --allow-empty -m "chore: trigger infra deploy"
git push origin main
```

**Manual** (to target a specific environment):
1. Go to **Actions → Deploy Infrastructure to Azure → Run workflow**
2. Select `environment`: `development`, `staging`, or `production`
3. Click **Run workflow**

---

## Verify the Deployment

```bash
# List resources in the dev resource group
az resource list \
  --resource-group rg-aigenius-dev \
  --query "[].{name:name, type:type, tags:tags}" \
  --output table

# Check tags on all resources
az resource list \
  --resource-group rg-aigenius-dev \
  --query "[?tags.managedBy == 'bicep'].{name:name, env:tags.environment}" \
  --output table
```

Expected: App Service Plan, Web App, and Static Web App all present with `managedBy=bicep` tag.

---

## Consuming Pipeline Outputs in Downstream Jobs

After `infra` completes, `deploy-api` and `deploy-web` can reference outputs:

```yaml
deploy-api:
  needs: [infra]
  runs-on: ubuntu-latest
  steps:
    - name: Deploy API to App Service
      run: |
        az webapp deploy \
          --name "${{ needs.infra.outputs.app-service-name }}" \
          --resource-group "rg-aigenius-dev" \
          --src-path app.zip

deploy-web:
  needs: [infra]
  runs-on: ubuntu-latest
  steps:
    - name: Deploy Static Web App
      uses: Azure/static-web-apps-deploy@v1
      with:
        azure_static_web_apps_api_token: "${{ needs.infra.outputs.static-web-app-token }}"
        action: upload
        app_location: src/ai-genius-web
        output_location: dist
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `AADSTS70021: No matching federated identity record found` | Federated credential subject mismatch | Verify the subject in Step 1c matches the exact branch ref |
| `ResourceGroupNotFound` | Resource group does not exist and `az group create` failed | Check `AZURE_CLIENT_ID` has Contributor on the subscription |
| `InvalidTemplate: Parameter 'environment' ... is not allowed` | Long-form value passed to Bicep | Verify the `env-map` step ran and `ENV_SHORT` is `dev`/`qa`/`prod` |
| `Failed to find parameters file` | Missing `bicep/parameters.<env>.json` | Create the three parameter files (see data-model.md) |
| Pipeline cancelled before completion | Concurrency group cancelled by newer push | Normal behaviour — the newer run will complete the deployment |
