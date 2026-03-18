param(
  [Parameter(Mandatory = $false)]
  [string]$DeploymentId,

  [Parameter(Mandatory = $false)]
  [string]$Description = "update from local"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".clasp.json")) {
  Write-Host "Missing apps-script/.clasp.json project settings file."
  Write-Host "Create it from .clasp.json.example and set your scriptId first."
  exit 1
}

Write-Host "Checking clasp auth..."
npx clasp show-authorized-user | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "You are not logged in to clasp. Run: npx clasp login"
  exit 1
}

Write-Host "Pushing Apps Script code..."
npx clasp push --force
if ($LASTEXITCODE -ne 0) {
  Write-Host "clasp push failed."
  exit 1
}

Write-Host "Creating Apps Script version..."
npx clasp version "$Description"
if ($LASTEXITCODE -ne 0) {
  Write-Host "clasp version failed."
  exit 1
}

if ($DeploymentId) {
  Write-Host "Updating existing deployment: $DeploymentId"
  npx clasp redeploy "$DeploymentId" --description "$Description"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "clasp redeploy failed."
    exit 1
  }
} else {
  Write-Host "Creating new web app deployment..."
  npx clasp deploy --description "$Description"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "clasp deploy failed."
    exit 1
  }
}

Write-Host "Done."
