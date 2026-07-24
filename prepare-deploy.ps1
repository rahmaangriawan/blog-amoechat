# Script untuk menyiapkan file deployment Next.js (Manual) - Versi Prisma Fix
# Cara pakai: Klik kanan file ini > Run with PowerShell

$ErrorActionPreference = "Continue"
$deployDir = ".deploy_manual"
$zipFile = "amoechat-deploy.zip"

Write-Host "1. Menjalankan Build (Produksi)..." -ForegroundColor Cyan
pnpm build

Write-Host "2. Menyiapkan folder sementara..." -ForegroundColor Cyan
if (Test-Path $deployDir) { 
    Remove-Item -Recurse -Force $deployDir -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

Write-Host "3. Menyalin file Standalone..." -ForegroundColor Cyan
Copy-Item -Path ".next\standalone\*" -Destination $deployDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "4. Menyalin file Static..." -ForegroundColor Cyan
$targetStaticDir = Join-Path $deployDir ".next\static"
if (!(Test-Path $targetStaticDir)) { New-Item -ItemType Directory -Path $targetStaticDir -Force | Out-Null }
Copy-Item -Path ".next\static\*" -Destination $targetStaticDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "5. Menyalin folder Public..." -ForegroundColor Cyan
Copy-Item -Path "public" -Destination $deployDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "6. Menyalin folder Prisma..." -ForegroundColor Cyan
Copy-Item -Path "prisma" -Destination $deployDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "7. Menyalin Engine Prisma untuk Linux..." -ForegroundColor Cyan
# Kita pastikan file query-engine-debian/rhel ikut ter-copy dari node_modules lokal
$engineSource = "node_modules\.prisma\client\libquery_engine-*"
$engineDest = Join-Path $deployDir "node_modules\.prisma\client"
if (!(Test-Path $engineDest)) { New-Item -ItemType Directory -Path $engineDest -Force | Out-Null }
Copy-Item -Path $engineSource -Destination $engineDest -Force -ErrorAction SilentlyContinue

Write-Host "8. Membuat file ZIP..." -ForegroundColor Green
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Get-ChildItem -Path $deployDir -Force | Compress-Archive -DestinationPath $zipFile -Force

Write-Host "`nSELESAI! Silakan upload ulang '$zipFile'." -ForegroundColor Green
