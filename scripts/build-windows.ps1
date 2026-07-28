param(
  [switch]$AllPlatforms
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$certificateScript = Join-Path $PSScriptRoot "ensure-code-signing-cert.ps1"
$passwordPath = Join-Path $projectRoot "build\certs\rankup-local-code-signing.password"
$builderPath = Join-Path $projectRoot "node_modules\.bin\electron-builder.cmd"

& $certificateScript
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

if (-not (Test-Path -LiteralPath $builderPath)) {
  throw "electron-builder is not installed. Run npm install first."
}

$env:WIN_CSC_KEY_PASSWORD = [System.IO.File]::ReadAllText($passwordPath).Trim()

Push-Location $projectRoot
try {
  if ($AllPlatforms) {
    & $builderPath -wml
  } else {
    & $builderPath --win
  }
  $builderExitCode = $LASTEXITCODE
} finally {
  Pop-Location
  Remove-Item Env:\WIN_CSC_KEY_PASSWORD -ErrorAction SilentlyContinue
}

exit $builderExitCode
