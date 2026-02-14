$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path $Path)) {
    return $map
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Length -eq 2) {
      $map[$parts[0].Trim()] = $parts[1].Trim()
    }
  }

  return $map
}

function Upsert-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $lines = @()
  if (Test-Path $Path) {
    $lines = Get-Content $Path
  }

  $updated = $false
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\s*$([regex]::Escape($Key))=") {
      $lines[$i] = "$Key=$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines += "$Key=$Value"
  }

  Set-Content -Path $Path -Value $lines
}

function Invoke-ForgeCreate {
  param(
    [string]$Contract,
    [string]$RpcUrl,
    [string]$PrivateKey,
    [string[]]$ConstructorArgs = @()
  )

  $cmdArgs = @(
    "create",
    $Contract,
    "--broadcast",
    "--rpc-url", $RpcUrl,
    "--private-key", $PrivateKey
  )

  if ($ConstructorArgs.Count -gt 0) {
    $cmdArgs += "--constructor-args"
    $cmdArgs += $ConstructorArgs
  }

  $prevErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $output = & forge @cmdArgs 2>&1
  $exitCode = $LASTEXITCODE
  $ErrorActionPreference = $prevErrorActionPreference

  $text = ($output | Out-String)

  if ($exitCode -ne 0) {
    throw "forge create failed for $Contract (exit code: $exitCode)"
  }

  # Strip ANSI escape codes to make regex parsing reliable across terminals.
  $cleanText = [regex]::Replace($text, "\x1B\[[0-9;]*[A-Za-z]", "")

  $patterns = @(
    "(?im)deployed to:\s*(0x[a-fA-F0-9]{40})",
    "(?im)contract address:\s*(0x[a-fA-F0-9]{40})",
    "(?im)address:\s*(0x[a-fA-F0-9]{40})"
  )

  $deployedAddress = $null
  foreach ($pattern in $patterns) {
    $match = [regex]::Match($cleanText, $pattern)
    if ($match.Success) {
      $deployedAddress = $match.Groups[1].Value
      break
    }
  }

  if (-not $deployedAddress) {
    throw "Failed to parse deployed address for $Contract. Raw output: $cleanText"
  }

  $txHashPatterns = @(
    "(?im)transaction hash:\s*(0x[a-fA-F0-9]{64})",
    "(?im)tx hash:\s*(0x[a-fA-F0-9]{64})",
    "(?im)hash:\s*(0x[a-fA-F0-9]{64})"
  )

  $txHash = $null
  foreach ($pattern in $txHashPatterns) {
    $txMatch = [regex]::Match($cleanText, $pattern)
    if ($txMatch.Success) {
      $txHash = $txMatch.Groups[1].Value
      break
    }
  }

  if (-not $txHash) {
    throw "Failed to parse tx hash for $Contract. Raw output: $cleanText"
  }

  Write-Host "Deployed $Contract"
  Write-Host "  Address: $deployedAddress"
  Write-Host "  Tx hash: $txHash"

  return @{
    Address = $deployedAddress
    TxHash = $txHash
  }
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot ".env"
$repoPath = Join-Path $projectRoot ".openfort-7702-account"

$envMap = Read-EnvFile -Path $envPath

$privateKey = $envMap["DEPLOYER_PRIVATE_KEY"]
if (-not $privateKey) {
  $privateKey = $envMap["OPENFORT_DEPLOYER_PRIVATE_KEY"]
}
if (-not $privateKey) {
  throw "Missing DEPLOYER_PRIVATE_KEY (or OPENFORT_DEPLOYER_PRIVATE_KEY) in .env"
}

$rpcUrl = $envMap["VITE_RPC_URL"]
if (-not $rpcUrl) {
  $rpcUrl = "https://carrot.megaeth.com/rpc"
}

$entryPoint = $envMap["OPENFORT_ENTRYPOINT_ADDRESS"]
if (-not $entryPoint) {
  $entryPoint = "0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108"
}

if (-not (Test-Path $repoPath)) {
  throw "Missing .openfort-7702-account directory. Clone the openfort-7702-account repo first."
}

Push-Location $repoPath
try {
  $prevErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  if (-not (Test-Path (Join-Path $repoPath "lib\forge-std"))) {
    & forge install
    if ($LASTEXITCODE -ne 0) {
      throw "forge install failed"
    }
  }

  & forge build
  if ($LASTEXITCODE -ne 0) {
    throw "forge build failed"
  }

  $webAuthnVerifierResult = Invoke-ForgeCreate `
    -Contract "src/utils/WebAuthnVerifierV2.sol:WebAuthnVerifierV2" `
    -RpcUrl $rpcUrl `
    -PrivateKey $privateKey
  $webAuthnVerifier = $webAuthnVerifierResult.Address

  $gasPolicyResult = Invoke-ForgeCreate `
    -Contract "src/utils/GasPolicy.sol:GasPolicy" `
    -RpcUrl $rpcUrl `
    -PrivateKey $privateKey `
    -ConstructorArgs @("110000", "360000", "240000", "60000", "60000")
  $gasPolicy = $gasPolicyResult.Address

  $opf7702Result = Invoke-ForgeCreate `
    -Contract "src/core/OPF7702.sol:OPF7702" `
    -RpcUrl $rpcUrl `
    -PrivateKey $privateKey `
    -ConstructorArgs @($entryPoint, $webAuthnVerifier, $gasPolicy)
  $opf7702 = $opf7702Result.Address
}
finally {
  $ErrorActionPreference = $prevErrorActionPreference
  Pop-Location
}

Upsert-EnvValue -Path $envPath -Key "VITE_OPENFORT_CHAIN_ID" -Value "6343"
Upsert-EnvValue -Path $envPath -Key "VITE_RPC_URL" -Value $rpcUrl
Upsert-EnvValue -Path $envPath -Key "VITE_OPENFORT_IMPLEMENTATION_CONTRACT" -Value $opf7702
Upsert-EnvValue -Path $envPath -Key "OPENFORT_WEBAUTHN_VERIFIER_ADDRESS" -Value $webAuthnVerifier
Upsert-EnvValue -Path $envPath -Key "OPENFORT_GAS_POLICY_ADDRESS" -Value $gasPolicy

Write-Host ""
Write-Host "Deployment complete:"
Write-Host "WebAuthnVerifierV2: $webAuthnVerifier"
Write-Host "WebAuthnVerifierV2 tx: $($webAuthnVerifierResult.TxHash)"
Write-Host "GasPolicy:          $gasPolicy"
Write-Host "GasPolicy tx:       $($gasPolicyResult.TxHash)"
Write-Host "OPF7702:            $opf7702"
Write-Host "OPF7702 tx:         $($opf7702Result.TxHash)"
Write-Host ""
Write-Host "Updated .env with VITE_OPENFORT_IMPLEMENTATION_CONTRACT and dependency addresses."
