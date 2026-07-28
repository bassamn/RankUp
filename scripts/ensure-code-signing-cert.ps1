param()

$ErrorActionPreference = "Stop"

if ($env:OS -ne "Windows_NT") {
  throw "The local RankUp code-signing certificate can only be generated on Windows."
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$certificateDirectory = Join-Path $projectRoot "build\certs"
$certificatePath = Join-Path $certificateDirectory "rankup-local-code-signing.pfx"
$publicCertificatePath = Join-Path $certificateDirectory "rankup-local-code-signing.cer"
$passwordPath = Join-Path $certificateDirectory "rankup-local-code-signing.password"

if ((Test-Path -LiteralPath $certificatePath) -and (Test-Path -LiteralPath $passwordPath)) {
  Write-Host "Using existing local RankUp signing certificate."
  exit 0
}

if ((Test-Path -LiteralPath $certificatePath) -or (Test-Path -LiteralPath $passwordPath)) {
  throw "The local signing certificate is incomplete. Remove build\certs and run the command again."
}

New-Item -ItemType Directory -Path $certificateDirectory -Force | Out-Null

$passwordBytes = New-Object byte[] 32
$randomGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try {
  $randomGenerator.GetBytes($passwordBytes)
} finally {
  $randomGenerator.Dispose()
}
$plainPassword = [Convert]::ToBase64String($passwordBytes).Replace("/", "_").Replace("+", "-").TrimEnd("=")
$securePassword = ConvertTo-SecureString -String $plainPassword -AsPlainText -Force

$certificate = New-SelfSignedCertificate `
  -Type CodeSigningCert `
  -Subject "CN=RankUp Local Development" `
  -FriendlyName "RankUp Local Development Code Signing" `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyAlgorithm RSA `
  -KeyLength 3072 `
  -HashAlgorithm SHA256 `
  -KeyExportPolicy Exportable `
  -NotAfter (Get-Date).AddYears(5)

Export-PfxCertificate `
  -Cert $certificate `
  -FilePath $certificatePath `
  -Password $securePassword `
  -ChainOption EndEntityCertOnly `
  -NoProperties | Out-Null

Export-Certificate `
  -Cert $certificate `
  -FilePath $publicCertificatePath `
  -Type CERT | Out-Null

[System.IO.File]::WriteAllText($passwordPath, $plainPassword)

Write-Host "Created self-signed RankUp code-signing certificate:"
Write-Host "  $certificatePath"
Write-Host "The certificate and password are local-only and ignored by Git."
