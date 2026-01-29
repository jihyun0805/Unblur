# Local pipeline test: upload -> STT -> summarize (no DB write)
param(
  [string]$InputFile = ".\.tmp\ai-pipeline\test.mp3",
  [string]$Bucket = "recordings",
  [string]$Prefix = "audio",
  [string]$MinioEndpoint = "minio:9000",
  [string]$MinioAccessKey = "minio",
  [string]$MinioSecretKey = "minio123"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputFile)) {
  throw "Input file not found: $InputFile"
}

if (-not $env:GMS_KEY) {
  throw "GMS_KEY is not set. Set `$env:GMS_KEY before running."
}

$mcImage = "minio/mc:latest"
$objectName = (Split-Path -Leaf $InputFile)
$objectKey = "$Bucket/$Prefix/$objectName"
$mcHost = "http://$MinioAccessKey`:$MinioSecretKey@$MinioEndpoint"

Write-Host "Using input: $InputFile"
Write-Host "MinIO bucket: $Bucket"
Write-Host "MinIO object: $objectKey"

# Ensure bucket exists
Write-Host "Ensuring bucket exists..."
& docker run --rm --network be_unblur-net `
  -e "MC_HOST_local=$mcHost" `
  $mcImage mb -p "local/$Bucket" | Out-Null

# Upload file
Write-Host "Uploading to MinIO..."
$inputAbs = Resolve-Path $InputFile
$inputRel = (Resolve-Path -Relative $inputAbs.Path) -replace "^[.][/\\\\]",""
$inputRel = $inputRel -replace "[\\\\]","/"
& docker run --rm --network be_unblur-net `
  -v "${PWD}:/work" `
  -e "MC_HOST_local=$mcHost" `
  $mcImage cp "/work/$inputRel" "local/$objectKey" | Out-Null

# Download to local temp
$tmpDir = ".\.tmp\ai-pipeline"
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$downloadPath = Join-Path $tmpDir $objectName

Write-Host "Downloading from MinIO..."
$downloadRel = ($downloadPath -replace "^[.][/\\\\]","")
$downloadRel = $downloadRel -replace "[\\\\]","/"
& docker run --rm --network be_unblur-net `
  -v "${PWD}:/work" `
  -e "MC_HOST_local=$mcHost" `
  $mcImage cp "local/$objectKey" "/work/$downloadRel" | Out-Null

# STT (Whisper)
Write-Host "Calling STT..."
$sttResp = & curl.exe -s --max-time 40 `
  "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions" `
  -H "Authorization: Bearer $env:GMS_KEY" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@$downloadPath" `
  -F "model=whisper-1"
$sttResp | Out-File -Encoding utf8 "$tmpDir\_stt_result.json"

$sttObj = $sttResp | ConvertFrom-Json
$sttText = $sttObj.text
$sttText | Out-File -Encoding utf8 "$tmpDir\_stt_text.txt"

if (-not $sttText) {
  throw "STT text is empty. Check $tmpDir\\_stt_result.json"
}

# Summarize (Gemini)
Write-Host "Preparing summary request..."
$summaryReq = @{
  contents = @(
    @{
      parts = @(
        @{
          text = "다음 전사문을 한국어로 요약해줘. 핵심만 3~5문장으로.`n`n$sttText"
        }
      )
    }
  )
} | ConvertTo-Json -Depth 6

$summaryReq | Out-File -Encoding utf8 "$tmpDir\_summary_req.json"

Write-Host "Calling Gemini summary..."
$summaryResp = & curl.exe -s --max-time 60 `
  "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent" `
  -H "Content-Type: application/json" `
  -H "x-goog-api-key: $env:GMS_KEY" `
  -X POST `
  -d $summaryReq

$summaryResp | Out-File -Encoding utf8 "$tmpDir\_summary_result.json"

Write-Host "Done."
Write-Host "STT: $tmpDir\\_stt_result.json"
Write-Host "Summary: $tmpDir\\_summary_result.json"
