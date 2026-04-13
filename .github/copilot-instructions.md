

Keep everything simple and dont over think it.
Don't spend too much time on research, use the standard best practises.
Keep the workflow run as fast as possible, so that you can iterate quickly.
Don't worry about edge cases, just focus on the main use case.

## GitHub Actions Workflows

- **Frontend Deployment**: `.github/workflows/deploy-web.yml` - Deploys React frontend to Azure Static Web Apps on push to main
- **Infrastructure Deployment**: `.github/workflows/deploy-infra.yml` - Provisions Azure infrastructure using Bicep
