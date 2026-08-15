$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$cloudflaredPath = Join-Path $scriptDir "cloudflared.exe"
$projectRoot = Split-Path -Parent $scriptDir

Write-Host "----------------------------------------------------" -ForegroundColor Cyan
Write-Host "🚀 Starting Vortex3D Platform" -ForegroundColor Cyan
Write-Host "----------------------------------------------------" -ForegroundColor Cyan

if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "Downloading cloudflared.exe..." -ForegroundColor Yellow
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Invoke-WebRequest -Uri $url -OutFile $cloudflaredPath
    Write-Host "Downloaded cloudflared.exe to $cloudflaredPath" -ForegroundColor Green
} else {
    Write-Host "cloudflared.exe already exists at $cloudflaredPath" -ForegroundColor Green
}

Write-Host "Launching Vortex3D..." -ForegroundColor Cyan
Set-Location $projectRoot
npm run launch
