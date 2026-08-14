#!/usr/bin/env bash
# ==============================================================
# Apogee by ByKpubaq | Adil - Universal One-Line Unix/macOS Installer
# Can be run locally OR remotely via:
#   curl -fsSL https://raw.githubusercontent.com/Kpubaq/apogee/main/scripts/install.sh | bash
# ==============================================================

set -e

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;35m   🛰️  INSTALLING APOGEE MISSION CONTROL  (ByKpubaq | Adil) \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "\033[1;31m❌ Node.js is not installed!\033[0m"
    echo -e "\033[1;33mPlease install Node.js (v18+) from https://nodejs.org and try again.\033[0m"
    exit 1
fi

INSTALL_DIR="$HOME/.apogee"

if [ -f "package.json" ] && grep -q "apogee" package.json; then
    INSTALL_DIR="$(pwd)"
    echo -e "\033[1;30m📍 Running from existing local directory: $INSTALL_DIR\033[0m"
else
    echo -e "\033[1;33m[1/4] Downloading Apogee from GitHub to $INSTALL_DIR...\033[0m"
    if [ -d "$INSTALL_DIR" ]; then
        cd "$INSTALL_DIR"
        git fetch --all --quiet || true
        git reset --hard origin/main --quiet || true
        git clean -fd --quiet || true
    else
        git clone --quiet https://github.com/Kpubaq/apogee.git "$INSTALL_DIR"
        cd "$INSTALL_DIR"
    fi
fi

cd "$INSTALL_DIR"

echo -e "\033[1;33m[2/4] Installing dependencies...\033[0m"
npm install --silent

echo -e "\033[1;33m[3/4] Building TypeScript...\033[0m"
npm run build --silent

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "\033[1;32m✔ .env file initialized.\033[0m"
fi

echo -e "\033[1;33m[4/4] Registering global 'apogee' command...\033[0m"
npm link

echo ""
echo -e "\033[1;32m==========================================================\033[0m"
echo -e "\033[1;32m✔ APOGEE INSTALLED SUCCESSFULLY!\033[0m"
echo -e "\033[1;36mYou can now run 'apogee' in ANY terminal window!\033[0m"
echo -e "\033[1;32m==========================================================\033[0m"
echo ""
echo -e "Try it now:"
echo -e "  \033[1;33mapogee\033[0m             -> Open Interactive Mission Control Dashboard"
echo -e "  \033[1;33mapogee status\033[0m      -> Check AntiGravity connection & ports"
echo -e "  \033[1;33mapogee qr\033[0m          -> Show WhatsApp Web pairing QR"
echo -e "  \033[1;33mapogee screenshot\033[0m  -> Take instant screenshot of IDE"
echo ""
