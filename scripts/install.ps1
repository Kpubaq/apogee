# ==============================================================
# Apogee by ByKpubaq | Adil - Universal One-Line Windows Installer
# Can be run locally OR remotely via:
#   irm https://raw.githubusercontent.com/Kpubaq/apogee/main/scripts/install.ps1 | iex
# ==============================================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🛰️  INSTALLING APOGEE MISSION CONTROL  (ByKpubaq | Adil) " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js prerequisite
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed on your system!" -ForegroundColor Red
    Write-Host "Please install Node.js (v18+) from https://nodejs.org and run this script again." -ForegroundColor Yellow
    exit 1
}

$InstallDir = "$HOME\.apogee"

# Check if script is running from inside the cloned repo or remotely
if (Test-Path "package.json") {
    $Pkg = Get-Content "package.json" -Raw
    if ($Pkg -like "*apogee*") {
        $InstallDir = (Get-Location).Path
        Write-Host "📍 Running from existing local directory: $InstallDir" -ForegroundColor Gray
    }
}

if ($InstallDir -eq "$HOME\.apogee") {
    Write-Host "[1/4] Downloading Apogee from GitHub to $InstallDir..." -ForegroundColor Yellow
    if (Test-Path $InstallDir) {
        Write-Host "Updating existing installation in $InstallDir..." -ForegroundColor Gray
        Set-Location $InstallDir
        if (Get-Command git -ErrorAction SilentlyContinue) {
            git fetch --all --quiet
            git reset --hard origin/main --quiet
            git clean -fd --quiet
        }
    } else {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            git clone --quiet https://github.com/Kpubaq/apogee.git $InstallDir
            Set-Location $InstallDir
        } else {
            # Fallback zip download if git is not installed
            Write-Host "Git not found, downloading source zip..." -ForegroundColor Gray
            $ZipPath = "$env:TEMP\apogee.zip"
            Invoke-WebRequest -Uri "https://github.com/Kpubaq/apogee/archive/refs/heads/main.zip" -OutFile $ZipPath
            Expand-Archive -Path $ZipPath -DestinationPath "$env:TEMP\apogee_unzip" -Force
            Move-Item "$env:TEMP\apogee_unzip\apogee-main" $InstallDir -Force
            Remove-Item $ZipPath -Force
            Remove-Item "$env:TEMP\apogee_unzip" -Recurse -Force
            Set-Location $InstallDir
        }
    }
} else {
    Set-Location $InstallDir
}

# 2. Install dependencies
Write-Host "[2/4] Installing dependencies..." -ForegroundColor Yellow
npm install --silent

# 3. Build project
Write-Host "[3/4] Compiling TypeScript..." -ForegroundColor Yellow
npm run build --silent

# Setup .env if missing
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✔ Default .env initialized." -ForegroundColor Green
    }
}

# 4. Link global command
Write-Host "[4/4] Registering global 'apogee' command..." -ForegroundColor Yellow
npm link

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "✔ APOGEE INSTALLED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "You can now run 'apogee' in ANY terminal window!" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Try it now:" -ForegroundColor White
Write-Host "  apogee             -> Open Interactive Mission Control Dashboard" -ForegroundColor Yellow
Write-Host "  apogee status      -> Check AntiGravity connection & ports" -ForegroundColor Yellow
Write-Host "  apogee qr          -> Show WhatsApp Web pairing QR" -ForegroundColor Yellow
Write-Host "  apogee screenshot  -> Take instant screenshot of IDE" -ForegroundColor Yellow
Write-Host ""
