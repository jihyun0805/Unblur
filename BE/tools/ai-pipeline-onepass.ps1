# One-pass: MP3 -> STT -> 1-sentence summary (Gemini)
param(
  [string]$InputFile = ".\\.tmp\\ai-pipeline\\550e8400-e29b-41d4-a716-446655440000_1.mp3",
  [string]$OutDir = ".\\.tmp\\ai-pipeline-onepass",
  [bool]$CleanupIntermediate = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $InputFile)) {
  throw "Input file not found: $InputFile"
}

if (-not $env:GMS_KEY) {
  throw "GMS_KEY is not set. Set `$env:GMS_KEY before running."
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$fileBase = [IO.Path]::GetFileNameWithoutExtension($InputFile)
$parts = $fileBase -split "_"
if ($parts.Length -lt 2) {
  throw "Filename must be {conferenceId}_{round}.mp3 (got: $fileBase)"
}
$round = $parts[-1]
$conferenceId = ($parts[0..($parts.Length - 2)] -join "_")
if (-not ($round -match '^\d+$')) {
  throw "Round must be numeric in filename (got: $round)"
}

$runDir = Join-Path $OutDir "${conferenceId}_${round}"
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

$meta = @{
  conferenceId = $conferenceId
  round = [int]$round
  inputFile = $InputFile
} | ConvertTo-Json -Depth 4
$meta | Out-File -Encoding utf8 (Join-Path $runDir "meta.json")

# STT (Whisper)
Write-Host "Calling STT..."
$sttResp = & curl.exe -s --max-time 120 `
  "https://gms.ssafy.io/gmsapi/api.openai.com/v1/audio/transcriptions" `
  -H "Authorization: Bearer $env:GMS_KEY" `
  -H "Content-Type: multipart/form-data" `
  -F "file=@$InputFile" `
  -F "model=whisper-1"

$sttResp | Out-File -Encoding utf8 (Join-Path $runDir "stt_result.json")
$sttObj = $sttResp | ConvertFrom-Json
$sttText = $sttObj.text

if (-not $sttText) {
  throw "STT text is empty. Check $OutDir\\stt_result.json"
}

# Summary (Gemini, constrained briefing)
Write-Host "Calling Gemini summary..."
$prompt = @'
System Role
너는 대화의 맥락을 정리하는 '데이팅 앱 대화 요약용 브리핑 봇'이야.
대화를 분석해 두 사람이 어떤 주제로 가장 오래 대화했는지 건조하고 담백하게 요약해줘.

Constraints
"두 분은~", "즐거우셨네요!" 같은 청유형이나 감탄사를 절대 쓰지 말 것.
대화 내용만 근거로 객관적인 사실만 서술할 것.
무엇에 대해 이야기했는지 명확히 명시할 것.(대화 주제가 명확히 드러나야 함)
40자 이내, 한 문장
존댓말로 작성할 것.
메타 설명, 접속어, 목록 없이 문장만 출력

대화 내용:
'@

$summaryReq = @{
  contents = @(
    @{
      parts = @(
        @{
          text = "$prompt`n$sttText"
        }
      )
    }
  )
} | ConvertTo-Json -Depth 8

$summaryReqPath = Join-Path $OutDir "summary_req.json"
$summaryReqPath = Join-Path $runDir "summary_req.json"
$summaryReq | Out-File -Encoding utf8 $summaryReqPath

& curl.exe -s --max-time 120 `
  "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" `
  -H "Content-Type: application/json" `
  -H "x-goog-api-key: $env:GMS_KEY" `
  -X POST `
  --data-binary "@$summaryReqPath" `
  | Out-File -Encoding utf8 (Join-Path $runDir "summary_result.json")

$summaryObj = Get-Content (Join-Path $runDir "summary_result.json") -Raw | ConvertFrom-Json
$summaryText = $summaryObj.candidates[0].content.parts[0].text

if (-not $summaryText) {
  throw "Summary text is empty. Check $OutDir\\summary_result.json"
}

$summaryText | Out-File -Encoding utf8 (Join-Path $runDir "summary_text.txt")
# TODO: DB 저장 연동 완료 후 summary_text.txt 파일 저장/유지 여부 재검토
if ($CleanupIntermediate) {
  $intermediate = @(
    (Join-Path $runDir "meta.json"),
    (Join-Path $runDir "stt_result.json"),
    (Join-Path $runDir "summary_req.json"),
    (Join-Path $runDir "summary_result.json")
  )
  foreach ($path in $intermediate) {
    if (Test-Path $path) {
      Remove-Item -Force $path
    }
  }
}
Write-Host "Done. Outputs in $runDir"


