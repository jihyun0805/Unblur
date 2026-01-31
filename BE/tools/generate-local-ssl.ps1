param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path,
  [string]$JavaHome = "",
  [string]$StorePass = "changeit"
)

$ErrorActionPreference = "Stop"

$sslDir = Join-Path $ProjectRoot "src\main\resources\ssl"
$keystorePath = Join-Path $sslDir "localhost.p12"
$defaultJavaHome = "C:\Program Files\Java\jdk-17"
$resolvedJavaHome = $JavaHome

if ([string]::IsNullOrWhiteSpace($resolvedJavaHome)) {
  if (-not [string]::IsNullOrWhiteSpace($env:JAVA_HOME)) {
    $resolvedJavaHome = $env:JAVA_HOME
  } else {
    $resolvedJavaHome = $defaultJavaHome
  }
}

if (Test-Path $resolvedJavaHome) {
  $env:JAVA_HOME = $resolvedJavaHome
  $env:Path = "$resolvedJavaHome\bin;$env:Path"
} else {
  $keytoolCmd = Get-Command keytool -ErrorAction SilentlyContinue
  if (-not $keytoolCmd) {
    throw "JAVA_HOME not found: $resolvedJavaHome (and keytool not found on PATH)"
  }
}

New-Item -ItemType Directory -Force -Path $sslDir | Out-Null
if (Test-Path $keystorePath) {
  Remove-Item -Force $keystorePath
}

keytool -genkeypair -alias localhost `
  -keyalg RSA -keysize 2048 `
  -storetype PKCS12 `
  -keystore $keystorePath `
  -storepass $StorePass -keypass $StorePass `
  -dname "CN=localhost, OU=Dev, O=Unblur, L=Seoul, S=Seoul, C=KR" `
  -ext "SAN=dns:localhost,ip:127.0.0.1"

Write-Output "Created keystore: $keystorePath"
