param(
  [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path,
  [string]$JavaHome = "C:\Program Files\Java\jdk-17",
  [string]$StorePass = "changeit"
)

$ErrorActionPreference = "Stop"

$sslDir = Join-Path $ProjectRoot "src\main\resources\ssl"
$keystorePath = Join-Path $sslDir "localhost.p12"

if (-not (Test-Path $JavaHome)) {
  throw "JAVA_HOME not found: $JavaHome"
}

$env:JAVA_HOME = $JavaHome
$env:Path = "$JavaHome\bin;$env:Path"

New-Item -ItemType Directory -Force -Path $sslDir | Out-Null

keytool -genkeypair -alias localhost `
  -keyalg RSA -keysize 2048 `
  -storetype PKCS12 `
  -keystore $keystorePath `
  -storepass $StorePass -keypass $StorePass `
  -dname "CN=localhost, OU=Dev, O=Unblur, L=Seoul, S=Seoul, C=KR"

Write-Output "Created keystore: $keystorePath"
