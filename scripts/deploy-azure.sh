#!/usr/bin/env bash
# Creates (or reuses) a free Azure Static Web App and uploads the production build.
# Requires: Azure CLI signed in (`az login`), Node 20+.
set -euo pipefail

APP_NAME="${APP_NAME:-dahmani-automotive-preview}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-dahmani-preview}"
LOCATION="${LOCATION:-westus2}"

cd "$(dirname "$0")/.."
npm ci --no-audit --no-fund
npm run build

az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none
if ! az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
  az staticwebapp create --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" --sku Free --output none
fi

# The token goes through the environment so it never appears in the process list.
SWA_CLI_DEPLOYMENT_TOKEN="$(az staticwebapp secrets list --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.apiKey --output tsv)"
export SWA_CLI_DEPLOYMENT_TOKEN
npx --yes @azure/static-web-apps-cli@2 deploy ./dist --env production

HOST="$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query defaultHostname --output tsv)"
echo
echo "Live at: https://$HOST"
