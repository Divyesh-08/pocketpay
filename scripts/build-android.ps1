param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$clientRoot = Join-Path $repoRoot 'client'
$gradleWrapper = Join-Path $clientRoot 'android\gradlew.bat'
$apkSource = Join-Path $clientRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
$apkOutputDir = Join-Path $repoRoot 'outputs'
$apkOutput = Join-Path $apkOutputDir 'PocketPay.apk'

try {
  $uri = [Uri]$ApiUrl
} catch {
  throw 'ApiUrl must be a valid HTTPS URL ending in /api.'
}
if ($uri.Scheme -ne 'https' -or -not $uri.AbsolutePath.TrimEnd('/').EndsWith('/api')) {
  throw 'ApiUrl must use HTTPS and end in /api, for example https://pocketpay-api.onrender.com/api.'
}
if (-not (Test-Path $gradleWrapper)) {
  throw "Android Gradle wrapper not found: $gradleWrapper"
}

$previousApiUrl = $env:VITE_API_URL
$env:VITE_API_URL = $ApiUrl.TrimEnd('/')
try {
  Push-Location $clientRoot
  try {
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Web app build failed.' }

    $capacitorCli = Join-Path $clientRoot 'node_modules\.bin\cap.cmd'
    if (-not (Test-Path $capacitorCli)) { throw "Capacitor CLI not found: $capacitorCli" }
    & $capacitorCli sync android
    if ($LASTEXITCODE -ne 0) { throw 'Capacitor Android sync failed.' }

    Push-Location (Join-Path $clientRoot 'android')
    try {
      & $gradleWrapper assembleDebug
      if ($LASTEXITCODE -ne 0) { throw 'Android debug APK build failed.' }
    } finally {
      Pop-Location
    }
  } finally {
    Pop-Location
  }
} finally {
  if ($null -eq $previousApiUrl) {
    Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue
  } else {
    $env:VITE_API_URL = $previousApiUrl
  }
}

if (-not (Test-Path $apkSource)) {
  throw "Android build finished without producing $apkSource"
}
New-Item -ItemType Directory -Path $apkOutputDir -Force | Out-Null
Copy-Item -LiteralPath $apkSource -Destination $apkOutput -Force
Write-Output "APK created: $apkOutput"
