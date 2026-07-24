# Script untuk menyiapkan folder deploy dan compress jadi zip
# Jalankan dari root project: .\scripts\prepare-deploy.ps1

Write-Host "=== Preparing deploy folder ===" -ForegroundColor Cyan

# Hapus folder deploy lama
if (Test-Path ".deploy") {
    Remove-Item -Recurse -Force ".deploy"
}
New-Item -ItemType Directory ".deploy" | Out-Null

# Copy standalone output
Write-Host "Copying standalone output..."
Copy-Item -Recurse ".next\standalone\*" ".deploy\"

# Copy static files
Write-Host "Copying static files..."
New-Item -ItemType Directory ".deploy\.next" -ErrorAction SilentlyContinue | Out-Null
Copy-Item -Recurse ".next\static" ".deploy\.next\static"

# Copy public folder
Write-Host "Copying public folder..."
Copy-Item -Recurse "public" ".deploy\public"

# Copy prisma
Write-Host "Copying prisma..."
New-Item -ItemType Directory ".deploy\prisma" -ErrorAction SilentlyContinue | Out-Null
Copy-Item "prisma\schema.prisma" ".deploy\prisma\"
Copy-Item -Recurse "prisma\migrations" ".deploy\prisma\migrations" -ErrorAction SilentlyContinue
Copy-Item "prisma.config.ts" ".deploy\"

# Hapus file yang tidak perlu
Write-Host "Cleaning up..."
Get-ChildItem ".deploy" -Recurse -Filter "*.map" | Remove-Item -Force
Get-ChildItem ".deploy" -Recurse -Filter "*.md" | Remove-Item -Force
Get-ChildItem ".deploy" -Recurse -Filter "README*" | Remove-Item -Force
Get-ChildItem ".deploy" -Recurse -Filter "LICENSE*" | Remove-Item -Force

# Hapus binary platform lain
Get-ChildItem ".deploy" -Recurse | Where-Object { $_.Name -match "darwin|win32|windows" } | Remove-Item -Force -ErrorAction SilentlyContinue

# Hapus source code (sudah di-bundle)
Remove-Item -Recurse -Force ".deploy\app" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".deploy\components" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".deploy\lib" -ErrorAction SilentlyContinue

# Stats
$fileCount = (Get-ChildItem ".deploy" -Recurse -File).Count
$size = (Get-ChildItem ".deploy" -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "File count: $fileCount" -ForegroundColor Green
Write-Host "Total size: $([math]::Round($size, 1)) MB" -ForegroundColor Green

# Compress jadi zip
Write-Host "Compressing to deploy.zip..."
if (Test-Path "deploy.zip") { Remove-Item "deploy.zip" }
Compress-Archive -Path ".deploy\*" -DestinationPath "deploy.zip"

$zipSize = (Get-Item "deploy.zip").Length / 1MB
Write-Host "=== deploy.zip ready: $([math]::Round($zipSize, 1)) MB ===" -ForegroundColor Green
Write-Host ""
Write-Host "Langkah selanjutnya:" -ForegroundColor Yellow
Write-Host "1. Upload deploy.zip ke cPanel File Manager folder app"
Write-Host "2. Extract di sana"
Write-Host "3. Restart Node.js App dari cPanel"
