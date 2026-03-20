
az group create --name "rg-aigenius" --location "eastus2" 

az deployment group create --resource-group "rg-aigenius" --template-file bicep/main.bicep --parameters "bicep/main.parameters.json"
