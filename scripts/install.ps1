# ==============================================================
# Apogee by ByKpubaq | Adil - Windows Global Setup Installer
# ==============================================================

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🛰️  INSTALLING APOGEE MISSION CONTROL  (ByKpubaq | Adil) " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Install dependencies
Write-Host "[1/4] Installing npm packages..." -ForegroundColor Yellow
npm install

# 2. Build TypeScript
Write-Host "[2/4] Compiling TypeScript project..." -ForegroundColor Yellow
npm run build

# 3. Environment configuration
if (-not (Test-Path ".env")) {
    Write-Host "[3/4] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✔ .env file initialized." -ForegroundColor Green
} else {
    Write-Host "[3/4] .env configuration detected." -ForegroundColor Green
}

# 4. Link global CLI alias
Write-Host "[4/4] Registering global 'apogee' command..." -ForegroundColor Yellow
npm link

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "✔ APOGEE IS READY!" -ForegroundColor Green
Write-Host "You can now run 'apogee' anywhere in your terminal!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Quick commands:" -ForegroundColor White
Write-Host "  apogee             -> Open Interactive Mission Control Dashboard" -ForegroundColor Yellow
Write-Host "  apogee status      -> Check AntiGravity 2.0 / IDE connection" -ForegroundColor Yellow
Write-Host "  apogee screenshot  -> Take instant IDE screenshot" -ForegroundColor Yellow
Write-Host "  apogee qr          -> Show WhatsApp Web pairing QR" -ForegroundColor Yellow
Write-Host "  apogee start       -> Start 24/7 background service" -ForegroundColor Yellow
Write-Host ""
